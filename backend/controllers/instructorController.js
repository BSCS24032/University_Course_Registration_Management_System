const db = require('../config/db');

/** GET /instructors/me/sections — sections the logged-in instructor teaches. */
exports.getMySections = async (req, res) => {
    if (req.user.role !== 'Instructor' && req.user.role !== 'Admin') {
        return res.status(403).json({ status: 'error', message: 'Instructor role required.' });
    }
    const id = req.user.role === 'Admin' ? req.query.instructor_id : req.user.linked_id;
    if (!id) return res.status(400).json({ status: 'error', message: 'Instructor id required.' });

    try {
        const [rows] = await db.execute(
            `SELECT s.section_id, c.course_code, c.name AS course_name, c.credits,
                    s.semester, s.year, s.schedule_days, s.schedule_time, s.room,
                    s.capacity, s.enrolled_count
             FROM section s JOIN course c ON s.course_id = c.course_id
             WHERE s.instructor_id = ?
             ORDER BY s.year DESC, s.semester DESC`,
            [id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/** GET /sections/:section_id/roster — uses Phase 1 view vw_section_roster. */
exports.getSectionRoster = async (req, res) => {
    const { section_id } = req.params;
    try {
        // Authorization: Admin always, Instructor only if they teach this section.
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                'SELECT instructor_id FROM section WHERE section_id = ?', [section_id]
            );
            if (own.length === 0) return res.status(404).json({ status: 'error', message: 'Section not found.' });
            if (own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({ status: 'error', message: 'You do not teach this section.' });
            }
        }

        const [students] = await db.execute(
            `SELECT e.enrollment_id, e.student_id,
                    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    s.email, s.cgpa, e.status, e.grade, e.grade_points
             FROM enrollment e JOIN student s ON e.student_id = s.student_id
             WHERE e.section_id = ?
             ORDER BY s.last_name, s.first_name`,
            [section_id]
        );
        res.status(200).json({ status: 'success', data: students });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};
