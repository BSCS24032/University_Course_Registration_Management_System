const db = require('../config/db');

/** Instructors create assignments for sections they teach; Admins can create for any. */
exports.createAssignment = async (req, res) => {
    const { section_id, title, description, max_marks, weightage, due_date } = req.body;
    if (!section_id || !title || !max_marks || !weightage || !due_date) {
        return res.status(400).json({
            status: 'error',
            message: 'section_id, title, max_marks, weightage, and due_date are required.'
        });
    }

    try {
        if (req.user.role === 'Instructor') {
            const [own] = await db.execute(
                'SELECT instructor_id FROM section WHERE section_id = ?', [section_id]
            );
            if (own.length === 0) return res.status(404).json({ status: 'error', message: 'Section not found.' });
            if (own[0].instructor_id !== req.user.linked_id) {
                return res.status(403).json({ status: 'error', message: 'You do not teach this section.' });
            }
        }

        const [result] = await db.execute(
            `INSERT INTO assignment (section_id, title, description, max_marks, weightage, due_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [section_id, title, description || null, max_marks, weightage, due_date]
        );
        res.status(201).json({
            status: 'success',
            message: 'Assignment created.',
            data: { assignment_id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** GET /assignments/section/:section_id — list assignments for a section. */
exports.getSectionAssignments = async (req, res) => {
    const { section_id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT assignment_id, title, description, max_marks, weightage, due_date, created_at
             FROM assignment WHERE section_id = ? ORDER BY due_date`,
            [section_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** GET /assignments/my — all assignments from sections the student is enrolled in. */
exports.getMyAssignments = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });

    try {
        const [rows] = await db.execute(
            `SELECT a.assignment_id, a.title, a.max_marks, a.weightage, a.due_date,
                    c.course_code, c.name AS course_name, sec.section_id,
                    sub.submission_id, sub.marks_obtained, sub.is_late, sub.submission_date
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             JOIN assignment a ON a.section_id = sec.section_id
             LEFT JOIN submission sub ON sub.assignment_id = a.assignment_id AND sub.student_id = ?
             WHERE e.student_id = ? AND e.status = 'Enrolled'
             ORDER BY a.due_date`,
            [student_id, student_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** DELETE /assignments/:assignment_id — instructor/admin removes an assignment. */
exports.deleteAssignment = async (req, res) => {
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
        await db.execute('DELETE FROM assignment WHERE assignment_id = ?', [assignment_id]);
        res.status(200).json({ status: 'success', message: 'Assignment deleted.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
