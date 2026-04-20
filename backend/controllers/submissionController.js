const db = require('../config/db');

/**
 * POST /submissions — student submits work to an assignment.
 * Server computes is_late by comparing NOW() to assignment.due_date (client
 * cannot spoof). Enforces that the student is Enrolled in the relevant section.
 */
exports.createSubmission = async (req, res) => {
    const { assignment_id } = req.body;
    const student_id = req.user.linked_id;
    if (!assignment_id) return res.status(400).json({ status: 'error', message: 'assignment_id is required.' });
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [asg] = await conn.execute(
            'SELECT section_id, due_date FROM assignment WHERE assignment_id = ?',
            [assignment_id]
        );
        if (asg.length === 0) throw new Error('Assignment not found.');

        const [enr] = await conn.execute(
            `SELECT enrollment_id FROM enrollment
             WHERE student_id = ? AND section_id = ? AND status = 'Enrolled'`,
            [student_id, asg[0].section_id]
        );
        if (enr.length === 0) throw new Error('You are not enrolled in the section for this assignment.');

        const [dup] = await conn.execute(
            'SELECT submission_id FROM submission WHERE assignment_id = ? AND student_id = ?',
            [assignment_id, student_id]
        );
        if (dup.length > 0) throw new Error('You have already submitted this assignment.');

        const isLate = new Date() > new Date(asg[0].due_date);

        const [result] = await conn.execute(
            `INSERT INTO submission (assignment_id, student_id, submission_date, is_late)
             VALUES (?, ?, NOW(), ?)`,
            [assignment_id, student_id, isLate]
        );

        await conn.commit();
        res.status(201).json({
            status: 'success',
            message: 'Submission recorded.',
            data: { submission_id: result.insertId, is_late: isLate }
        });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/** PUT /submissions/:submission_id/grade — instructor assigns marks + feedback. */
exports.gradeSubmission = async (req, res) => {
    const { submission_id } = req.params;
    const { marks_obtained, feedback } = req.body;

    if (marks_obtained === undefined || marks_obtained === null) {
        return res.status(400).json({ status: 'error', message: 'marks_obtained is required.' });
    }
    if (marks_obtained < 0) {
        return res.status(400).json({ status: 'error', message: 'marks_obtained cannot be negative.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT a.max_marks, sec.instructor_id FROM submission sub
             JOIN assignment a ON sub.assignment_id = a.assignment_id
             JOIN section sec ON a.section_id = sec.section_id
             WHERE sub.submission_id = ?`,
            [submission_id]
        );
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Submission not found.' });

        if (req.user.role === 'Instructor' && rows[0].instructor_id !== req.user.linked_id) {
            return res.status(403).json({ status: 'error', message: 'You do not teach this section.' });
        }
        if (Number(marks_obtained) > Number(rows[0].max_marks)) {
            return res.status(400).json({
                status: 'error',
                message: `marks_obtained (${marks_obtained}) exceeds max_marks (${rows[0].max_marks}).`
            });
        }

        await db.execute(
            'UPDATE submission SET marks_obtained = ?, feedback = ? WHERE submission_id = ?',
            [marks_obtained, feedback || null, submission_id]
        );
        res.status(200).json({ status: 'success', message: 'Submission graded.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** GET /submissions/assignment/:assignment_id — list all submissions for an assignment. */
exports.getAssignmentSubmissions = async (req, res) => {
    const { assignment_id } = req.params;
    try {
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                `SELECT sec.instructor_id FROM assignment a
                 JOIN section sec ON a.section_id = sec.section_id
                 WHERE a.assignment_id = ?`,
                [assignment_id]
            );
            if (own.length === 0) return res.status(404).json({ status: 'error', message: 'Assignment not found.' });
            if (own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({ status: 'error', message: 'You do not teach this section.' });
            }
        }

        const [rows] = await db.execute(
            `SELECT sub.submission_id, sub.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    sub.submission_date, sub.marks_obtained, sub.feedback, sub.is_late
             FROM submission sub JOIN student s ON sub.student_id = s.student_id
             WHERE sub.assignment_id = ?
             ORDER BY sub.submission_date`,
            [assignment_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
