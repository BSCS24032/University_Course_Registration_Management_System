const db = require('../config/db');

/** GET /students/me/transcript — uses Phase 1 view vw_student_transcript. */
exports.getMyTranscript = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });
    try {
        const [rows] = await db.execute(
            'SELECT * FROM vw_student_transcript WHERE student_id = ? ORDER BY year DESC, semester DESC',
            [student_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/** GET /students/me/credit-load — uses Phase 1 view vw_student_current_credits. */
exports.getMyCreditLoad = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });
    try {
        const [rows] = await db.execute(
            'SELECT * FROM vw_student_current_credits WHERE student_id = ?',
            [student_id]
        );
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Student not found.' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/** GET /students/me/profile — full personal profile. */
exports.getMyProfile = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });
    try {
        const [rows] = await db.execute(
            `SELECT s.student_id, s.first_name, s.last_name, s.email, s.phone, s.dob, s.gender,
                    s.address, s.city, p.name AS program_name, p.degree_type, s.current_semester,
                    s.credit_limit, s.cgpa, s.status, s.enrollment_date
             FROM student s JOIN program p ON s.program_id = p.program_id
             WHERE s.student_id = ?`,
            [student_id]
        );
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};
