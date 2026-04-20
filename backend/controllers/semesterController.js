const db = require('../config/db');

/** GET /semesters — list all, newest first. */
exports.listSemesters = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM semester ORDER BY year DESC,
             FIELD(term, 'Spring','Summer','Fall') DESC`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /semesters/active — the one-and-only Active semester (or null). */
exports.getActiveSemester = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT * FROM semester WHERE status = 'Active' LIMIT 1`
        );
        res.status(200).json({ status: 'success', data: rows[0] || null });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** POST /semesters — Admin creates a new semester. */
exports.createSemester = async (req, res) => {
    const { term, year, start_date, end_date, registration_open,
            registration_close, add_drop_deadline, status } = req.body;
    if (!term || !year || !start_date || !end_date ||
        !registration_open || !registration_close || !add_drop_deadline) {
        return res.status(400).json({
            status: 'error',
            message: 'All date fields and term/year are required.'
        });
    }
    try {
        const [r] = await db.execute(
            `INSERT INTO semester
             (term, year, start_date, end_date, registration_open,
              registration_close, add_drop_deadline, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [term, year, start_date, end_date, registration_open,
             registration_close, add_drop_deadline, status || 'Upcoming']
        );
        res.status(201).json({ status: 'success', data: { semester_id: r.insertId } });
    } catch (e) {
        res.status(400).json({ status: 'error', message: e.message });
    }
};

/** PATCH /semesters/:id/status — change status (Upcoming/Active/Completed).
 *  Only one Active semester at a time — enforced here. */
exports.setSemesterStatus = async (req, res) => {
    const { status } = req.body;
    if (!['Upcoming', 'Active', 'Completed'].includes(status)) {
        return res.status(400).json({ status: 'error', message: 'Invalid status.' });
    }
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        if (status === 'Active') {
            // Demote any currently-Active semester to Completed first
            await conn.execute(
                `UPDATE semester SET status = 'Completed'
                 WHERE status = 'Active' AND semester_id <> ?`,
                [req.params.id]
            );
        }
        const [r] = await conn.execute(
            `UPDATE semester SET status = ? WHERE semester_id = ?`,
            [status, req.params.id]
        );
        if (r.affectedRows === 0) throw new Error('Semester not found.');
        await conn.commit();
        res.status(200).json({ status: 'success', message: `Semester is now ${status}.` });
    } catch (e) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: e.message });
    } finally {
        conn.release();
    }
};

/** DELETE /semesters/:id — Admin only. Will fail if referenced. */
exports.deleteSemester = async (req, res) => {
    try {
        await db.execute('DELETE FROM semester WHERE semester_id = ?', [req.params.id]);
        res.status(200).json({ status: 'success', message: 'Semester deleted.' });
    } catch (e) {
        res.status(400).json({ status: 'error', message: e.message });
    }
};
