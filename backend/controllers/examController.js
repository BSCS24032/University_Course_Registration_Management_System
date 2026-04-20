const db = require('../config/db');

/** POST /exams — Instructor/Admin schedules an exam for a section. */
exports.createExam = async (req, res) => {
    const { section_id, exam_type, title, exam_date, start_time,
            duration_minutes, room, total_marks, weightage } = req.body;
    if (!section_id || !exam_type || !title || !exam_date || !start_time ||
        !duration_minutes || !room || !total_marks || weightage === undefined) {
        return res.status(400).json({ status: 'error', message: 'All fields are required.' });
    }

    try {
        // Instructors can only schedule for their own sections
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                `SELECT instructor_id FROM section WHERE section_id = ?`,
                [section_id]
            );
            if (own.length === 0 || own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({
                    status: 'error',
                    message: 'You do not teach this section.'
                });
            }
        }

        const [r] = await db.execute(
            `INSERT INTO exam
             (section_id, exam_type, title, exam_date, start_time,
              duration_minutes, room, total_marks, weightage)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [section_id, exam_type, title, exam_date, start_time,
             duration_minutes, room, total_marks, weightage]
        );

        // Notify all enrolled students
        await db.execute(
            `INSERT INTO notification (user_id, type, title, body, link)
             SELECT u.user_id, 'General', ?, ?, '/exams'
             FROM enrollment e
             JOIN users u ON u.linked_id = e.student_id AND u.role = 'Student'
             WHERE e.section_id = ? AND e.status = 'Enrolled'`,
            [`Exam scheduled: ${title}`,
             `${exam_type} on ${exam_date} at ${start_time} in ${room}.`,
             section_id]
        );

        res.status(201).json({ status: 'success', data: { exam_id: r.insertId } });
    } catch (e) {
        res.status(400).json({ status: 'error', message: e.message });
    }
};

/** GET /exams/section/:section_id — list exams for a section. */
exports.getSectionExams = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM exam WHERE section_id = ? ORDER BY exam_date, start_time`,
            [req.params.section_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /exams/my — upcoming exams for the logged-in student. */
exports.getMyExams = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT ex.*, c.course_code, c.name AS course_name,
                    sec.semester, sec.year
             FROM exam ex
             JOIN section sec ON ex.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             JOIN enrollment e ON e.section_id = sec.section_id
             WHERE e.student_id = ? AND e.status = 'Enrolled'
             ORDER BY ex.exam_date, ex.start_time`,
            [req.user.linked_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** PUT /exams/:id — update exam details. */
exports.updateExam = async (req, res) => {
    const { title, exam_date, start_time, duration_minutes, room, total_marks, weightage } = req.body;
    try {
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                `SELECT sec.instructor_id FROM exam e
                 JOIN section sec ON e.section_id = sec.section_id
                 WHERE e.exam_id = ?`,
                [req.params.id]
            );
            if (own.length === 0 || own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({ status: 'error', message: 'Not your section.' });
            }
        }
        await db.execute(
            `UPDATE exam SET title = ?, exam_date = ?, start_time = ?,
             duration_minutes = ?, room = ?, total_marks = ?, weightage = ?
             WHERE exam_id = ?`,
            [title, exam_date, start_time, duration_minutes, room, total_marks, weightage, req.params.id]
        );
        res.status(200).json({ status: 'success', message: 'Exam updated.' });
    } catch (e) {
        res.status(400).json({ status: 'error', message: e.message });
    }
};

/** DELETE /exams/:id */
exports.deleteExam = async (req, res) => {
    try {
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                `SELECT sec.instructor_id FROM exam e
                 JOIN section sec ON e.section_id = sec.section_id
                 WHERE e.exam_id = ?`,
                [req.params.id]
            );
            if (own.length === 0 || own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({ status: 'error', message: 'Not your section.' });
            }
        }
        await db.execute(`DELETE FROM exam WHERE exam_id = ?`, [req.params.id]);
        res.status(200).json({ status: 'success', message: 'Exam deleted.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
