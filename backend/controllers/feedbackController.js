const db = require('../config/db');

/** POST /feedback — student submits feedback for an enrollment.
 *  Only allowed if the enrollment status is 'Completed' (semester ended). */
exports.submitFeedback = async (req, res) => {
    const { enrollment_id, rating_teaching, rating_content, rating_fairness, comments } = req.body;
    if (!enrollment_id || !rating_teaching || !rating_content || !rating_fairness) {
        return res.status(400).json({
            status: 'error',
            message: 'enrollment_id and all three ratings are required.'
        });
    }
    for (const r of [rating_teaching, rating_content, rating_fairness]) {
        if (r < 1 || r > 5) {
            return res.status(400).json({ status: 'error', message: 'Ratings must be 1 to 5.' });
        }
    }

    try {
        // Verify the enrollment belongs to this student and is Completed
        const [enr] = await db.execute(
            `SELECT e.student_id, e.section_id, e.status, sec.instructor_id
             FROM enrollment e JOIN section sec ON e.section_id = sec.section_id
             WHERE e.enrollment_id = ?`,
            [enrollment_id]
        );
        if (enr.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Enrollment not found.' });
        }
        if (enr[0].student_id !== req.user.linked_id) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only submit feedback for your own enrollments.'
            });
        }
        if (enr[0].status !== 'Completed') {
            return res.status(400).json({
                status: 'error',
                message: 'Feedback is only accepted after the course is completed.'
            });
        }

        const [r] = await db.execute(
            `INSERT INTO feedback
             (enrollment_id, instructor_id, section_id,
              rating_teaching, rating_content, rating_fairness, comments)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [enrollment_id, enr[0].instructor_id, enr[0].section_id,
             rating_teaching, rating_content, rating_fairness, comments || null]
        );
        res.status(201).json({
            status: 'success',
            data: { feedback_id: r.insertId },
            message: 'Thank you — your feedback has been recorded anonymously.'
        });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                status: 'error',
                message: 'You have already submitted feedback for this course.'
            });
        }
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /feedback/pending — student's completed enrollments that still need feedback. */
exports.getPendingFeedback = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT e.enrollment_id, c.course_code, c.name AS course_name,
                    sec.semester, sec.year,
                    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             JOIN instructor i ON sec.instructor_id = i.instructor_id
             LEFT JOIN feedback f ON f.enrollment_id = e.enrollment_id
             WHERE e.student_id = ? AND e.status = 'Completed' AND f.feedback_id IS NULL`,
            [req.user.linked_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /feedback/instructor/:id/summary — aggregate only (no individual ratings).
 *  Instructors see their own. Admins see any. */
exports.getInstructorSummary = async (req, res) => {
    const target = parseInt(req.params.id);
    if (req.user.role === 'Instructor' && req.user.linked_id !== target) {
        return res.status(403).json({
            status: 'error',
            message: 'Instructors can only view their own feedback summary.'
        });
    }
    try {
        const [[overall]] = await db.execute(
            `SELECT COUNT(*) AS response_count,
                    ROUND(AVG(rating_teaching), 2) AS avg_teaching,
                    ROUND(AVG(rating_content), 2)  AS avg_content,
                    ROUND(AVG(rating_fairness), 2) AS avg_fairness,
                    ROUND((AVG(rating_teaching) + AVG(rating_content) + AVG(rating_fairness)) / 3, 2) AS avg_overall
             FROM feedback WHERE instructor_id = ?`,
            [target]
        );

        const [bySection] = await db.execute(
            `SELECT sec.section_id, c.course_code, c.name AS course_name,
                    sec.semester, sec.year,
                    COUNT(f.feedback_id) AS response_count,
                    ROUND(AVG(f.rating_teaching), 2) AS avg_teaching,
                    ROUND(AVG(f.rating_content), 2)  AS avg_content,
                    ROUND(AVG(f.rating_fairness), 2) AS avg_fairness
             FROM feedback f
             JOIN section sec ON f.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             WHERE f.instructor_id = ?
             GROUP BY sec.section_id, c.course_code, c.name, sec.semester, sec.year`,
            [target]
        );

        // Fetch anonymous comments (no author info)
        const [comments] = await db.execute(
            `SELECT comments, submitted_at FROM feedback
             WHERE instructor_id = ? AND comments IS NOT NULL AND comments <> ''
             ORDER BY submitted_at DESC LIMIT 20`,
            [target]
        );

        res.status(200).json({
            status: 'success',
            data: { overall, by_section: bySection, comments }
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
