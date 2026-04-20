const db = require('../config/db');

/**
 * Letter-grade → grade-points map (standard 4.0 scale).
 * Used by every grading endpoint so scoring is consistent across the app.
 */
const GRADE_POINTS = {
    'A+': 4.00, 'A': 4.00, 'A-': 3.67,
    'B+': 3.33, 'B': 3.00, 'B-': 2.67,
    'C+': 2.33, 'C': 2.00, 'C-': 1.67,
    'D+': 1.33, 'D': 1.00, 'F': 0.00,
    'W':  null, 'I':  null
};

/**
 * Recalculate and persist a student's CGPA as the credit-weighted mean of
 * grade_points across all 'Completed' enrollments. Runs inside the caller's
 * connection so it's part of the same transaction.
 */
async function recalculateCgpa(conn, student_id) {
    const [rows] = await conn.execute(
        `SELECT SUM(e.grade_points * c.credits) AS weighted_points,
                SUM(c.credits) AS total_credits
         FROM enrollment e
         JOIN section sec ON e.section_id = sec.section_id
         JOIN course c ON sec.course_id = c.course_id
         WHERE e.student_id = ? AND e.status = 'Completed' AND e.grade_points IS NOT NULL`,
        [student_id]
    );
    const wp = rows[0].weighted_points;
    const tc = rows[0].total_credits;
    const cgpa = (tc && tc > 0) ? (wp / tc).toFixed(2) : '0.00';
    await conn.execute('UPDATE student SET cgpa = ? WHERE student_id = ?', [cgpa, student_id]);
    return cgpa;
}

/**
 * Ensure the logged-in instructor actually teaches the given section.
 * Admins bypass this check. Throws if unauthorized.
 */
async function assertInstructorOwns(conn, user, section_id) {
    if (user.role === 'Admin') return;
    const [rows] = await conn.execute(
        'SELECT instructor_id FROM section WHERE section_id = ?', [section_id]
    );
    if (rows.length === 0) throw new Error('Section not found.');
    if (rows[0].instructor_id !== user.linked_id) {
        throw new Error('You do not teach this section.');
    }
}

/**
 * POST /grades/assign
 * Assign a single letter grade to one enrollment, recalculate CGPA.
 * Body: { enrollment_id, grade }
 */
exports.assignGrade = async (req, res) => {
    const { enrollment_id, grade } = req.body;
    if (!enrollment_id || !grade) {
        return res.status(400).json({ status: 'error', message: 'enrollment_id and grade are required.' });
    }
    if (!(grade in GRADE_POINTS)) {
        return res.status(400).json({
            status: 'error',
            message: `Invalid grade '${grade}'. Allowed: ${Object.keys(GRADE_POINTS).join(', ')}.`
        });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        console.log(`\n--- Transaction: Assign grade ${grade} to enrollment ${enrollment_id} ---`);

        const [rows] = await conn.execute(
            `SELECT e.student_id, e.section_id, e.status, sec.instructor_id
             FROM enrollment e JOIN section sec ON e.section_id = sec.section_id
             WHERE e.enrollment_id = ? FOR UPDATE`,
            [enrollment_id]
        );
        if (rows.length === 0) throw new Error('Enrollment not found.');
        const enr = rows[0];

        if (req.user.role === 'Instructor' && enr.instructor_id !== req.user.linked_id) {
            throw new Error('You do not teach this section.');
        }
        if (enr.status === 'Dropped' || enr.status === 'Withdrawn') {
            throw new Error(`Cannot grade a '${enr.status}' enrollment.`);
        }

        const gp = GRADE_POINTS[grade];
        const newStatus = (grade === 'W' || grade === 'I') ? enr.status : 'Completed';

        await conn.execute(
            'UPDATE enrollment SET grade = ?, grade_points = ?, status = ? WHERE enrollment_id = ?',
            [grade, gp, newStatus, enrollment_id]
        );

        const newCgpa = await recalculateCgpa(conn, enr.student_id);

        await conn.commit();
        console.log('--- Committed ---\n');
        res.status(200).json({
            status: 'success',
            message: `Grade ${grade} assigned.`,
            data: { enrollment_id, grade, grade_points: gp, new_cgpa: newCgpa }
        });
    } catch (error) {
        await conn.rollback();
        console.error('--- ROLLED BACK ---', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/**
 * POST /grades/apply-threshold
 * Bulk assign grades for every enrolled student in a section by computing each
 * student's weighted percentage across all of that section's assignments, then
 * mapping to a letter grade using instructor-supplied cutoff thresholds.
 *
 * Body: {
 *   section_id: 5,
 *   thresholds: { "A+": 95, "A": 90, "A-": 85, "B+": 80, "B": 75, "B-": 70,
 *                 "C+": 65, "C": 60, "C-": 55, "D+": 50, "D": 45, "F": 0 }
 * }
 *
 * Missing grades (threshold key absent) are simply skipped; any weighted-average
 * below every provided threshold falls through to 'F' if F is supplied, else
 * the lowest supplied grade.
 */
exports.applyThresholds = async (req, res) => {
    const { section_id, thresholds } = req.body;
    if (!section_id || !thresholds || typeof thresholds !== 'object') {
        return res.status(400).json({ status: 'error', message: 'section_id and a thresholds object are required.' });
    }

    // Validate thresholds: every key must be a known grade, every value 0-100.
    const gradeOrder = Object.entries(thresholds)
        .filter(([g, cutoff]) => {
            if (!(g in GRADE_POINTS)) throw new Error(`Unknown grade '${g}' in thresholds.`);
            if (typeof cutoff !== 'number' || cutoff < 0 || cutoff > 100) {
                throw new Error(`Invalid cutoff for '${g}': must be between 0 and 100.`);
            }
            return g !== 'W' && g !== 'I';
        })
        .sort((a, b) => b[1] - a[1]); // descending by cutoff

    if (gradeOrder.length === 0) {
        return res.status(400).json({ status: 'error', message: 'No valid thresholds provided.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        console.log(`\n--- Transaction: Apply thresholds to section ${section_id} ---`);

        await assertInstructorOwns(conn, req.user, section_id);

        // For each enrolled student, compute weighted average across all assignments
        // in this section. Formula:
        //   weighted_pct = Σ( (marks_obtained / max_marks) * weightage ) / Σ(weightage)  × 100
        // We include only assignments where a submission exists; assignments with no
        // submission from that student contribute 0 to the numerator but still
        // count in the denominator (penalises non-submission).
        const [enrollments] = await conn.execute(
            `SELECT e.enrollment_id, e.student_id
             FROM enrollment e
             WHERE e.section_id = ? AND e.status = 'Enrolled' FOR UPDATE`,
            [section_id]
        );
        if (enrollments.length === 0) throw new Error('No active enrollments in this section.');

        const [assignments] = await conn.execute(
            'SELECT assignment_id, max_marks, weightage FROM assignment WHERE section_id = ?',
            [section_id]
        );
        const totalWeight = assignments.reduce((s, a) => s + Number(a.weightage), 0);
        if (totalWeight === 0) throw new Error('Section has no assignments with weightage — cannot grade.');

        const results = [];
        for (const enr of enrollments) {
            let weightedSum = 0;
            for (const a of assignments) {
                const [subs] = await conn.execute(
                    'SELECT marks_obtained FROM submission WHERE assignment_id = ? AND student_id = ?',
                    [a.assignment_id, enr.student_id]
                );
                const marks = (subs.length > 0 && subs[0].marks_obtained !== null)
                    ? Number(subs[0].marks_obtained) : 0;
                const pct = marks / Number(a.max_marks);  // 0..1
                weightedSum += pct * Number(a.weightage);
            }
            const weightedPct = (weightedSum / totalWeight) * 100;

            // Pick the first grade whose cutoff this student meets.
            let assigned = gradeOrder[gradeOrder.length - 1][0]; // fallback = lowest
            for (const [g, cutoff] of gradeOrder) {
                if (weightedPct >= cutoff) { assigned = g; break; }
            }
            const gp = GRADE_POINTS[assigned];

            await conn.execute(
                `UPDATE enrollment SET grade = ?, grade_points = ?, status = 'Completed'
                 WHERE enrollment_id = ?`,
                [assigned, gp, enr.enrollment_id]
            );

            const newCgpa = await recalculateCgpa(conn, enr.student_id);
            results.push({
                enrollment_id: enr.enrollment_id,
                student_id: enr.student_id,
                weighted_percent: weightedPct.toFixed(2),
                grade: assigned,
                grade_points: gp,
                new_cgpa: newCgpa
            });
        }

        await conn.commit();
        console.log(`--- Committed: ${results.length} grades assigned ---\n`);
        res.status(200).json({
            status: 'success',
            message: `Thresholds applied to ${results.length} student(s).`,
            data: results
        });
    } catch (error) {
        await conn.rollback();
        console.error('--- ROLLED BACK ---', error.message);
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/**
 * GET /grades/sections/:section_id/average
 * Average grade-points for all Completed enrollments in a section, plus count.
 */
exports.getSectionAverage = async (req, res) => {
    const { section_id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS graded_count, AVG(grade_points) AS average_gp,
                    MIN(grade_points) AS min_gp, MAX(grade_points) AS max_gp
             FROM enrollment
             WHERE section_id = ? AND grade_points IS NOT NULL`,
            [section_id]
        );
        const [meta] = await db.execute(
            `SELECT c.course_code, c.name AS course_name, sec.semester, sec.year
             FROM section sec JOIN course c ON sec.course_id = c.course_id
             WHERE sec.section_id = ?`,
            [section_id]
        );
        if (meta.length === 0) return res.status(404).json({ status: 'error', message: 'Section not found.' });

        res.status(200).json({
            status: 'success',
            data: {
                section_id: Number(section_id),
                ...meta[0],
                graded_count: rows[0].graded_count,
                average_grade_points: rows[0].average_gp !== null ? Number(rows[0].average_gp).toFixed(2) : null,
                min_grade_points: rows[0].min_gp,
                max_grade_points: rows[0].max_gp
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /grades/courses/:course_id/average
 * Average grade-points across every graded enrollment of any section of a course.
 */
exports.getCourseAverage = async (req, res) => {
    const { course_id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT COUNT(*) AS graded_count, AVG(e.grade_points) AS average_gp
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             WHERE sec.course_id = ? AND e.grade_points IS NOT NULL`,
            [course_id]
        );
        const [meta] = await db.execute(
            'SELECT course_code, name FROM course WHERE course_id = ?',
            [course_id]
        );
        if (meta.length === 0) return res.status(404).json({ status: 'error', message: 'Course not found.' });

        res.status(200).json({
            status: 'success',
            data: {
                course_id: Number(course_id),
                course_code: meta[0].course_code,
                course_name: meta[0].name,
                graded_count: rows[0].graded_count,
                average_grade_points: rows[0].average_gp !== null ? Number(rows[0].average_gp).toFixed(2) : null
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** GET /grades/sections/:section_id/grade-sheet — every student + their grade. */
exports.getGradeSheet = async (req, res) => {
    const { section_id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT e.enrollment_id, e.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    s.cgpa, e.grade, e.grade_points, e.status
             FROM enrollment e JOIN student s ON e.student_id = s.student_id
             WHERE e.section_id = ?
             ORDER BY s.last_name, s.first_name`,
            [section_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
