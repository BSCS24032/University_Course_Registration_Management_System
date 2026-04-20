const db = require('../config/db');

/** GET /announcements — visible announcements for the current user. */
exports.listAnnouncements = async (req, res) => {
    const { role, linked_id } = req.user;
    try {
        // Build audience filter based on role
        const clauses = [`a.audience = 'All'`];
        const params = [];

        if (role === 'Student') {
            clauses.push(`a.audience = 'Students'`);
            // Program-targeted
            const [stu] = await db.execute(
                `SELECT program_id, (SELECT department_id FROM program WHERE program_id = s.program_id) AS dept_id
                 FROM student s WHERE student_id = ?`,
                [linked_id]
            );
            if (stu.length > 0) {
                clauses.push(`(a.audience = 'Program' AND a.target_id = ?)`);
                params.push(stu[0].program_id);
                if (stu[0].dept_id) {
                    clauses.push(`(a.audience = 'Department' AND a.target_id = ?)`);
                    params.push(stu[0].dept_id);
                }
            }
            // Section-targeted (only sections the student is enrolled in)
            clauses.push(`(a.audience = 'Section' AND a.target_id IN (
                SELECT section_id FROM enrollment WHERE student_id = ? AND status = 'Enrolled'
            ))`);
            params.push(linked_id);
        } else if (role === 'Instructor') {
            clauses.push(`a.audience = 'Instructors'`);
            // Section-targeted (only sections they teach)
            clauses.push(`(a.audience = 'Section' AND a.target_id IN (
                SELECT section_id FROM section WHERE instructor_id = ?
            ))`);
            params.push(linked_id);
        } else if (role === 'Admin') {
            // Admin sees everything
            clauses.length = 0;
            clauses.push('1=1');
        }

        const where = `(${clauses.join(' OR ')}) AND (a.expires_at IS NULL OR a.expires_at > NOW())`;

        const [rows] = await db.execute(
            `SELECT a.*, u.email AS posted_by_email
             FROM announcement a
             JOIN users u ON a.posted_by_user_id = u.user_id
             WHERE ${where}
             ORDER BY a.is_pinned DESC, a.posted_at DESC`,
            params
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** POST /announcements — Admin or Instructor posts. Fans out notifications. */
exports.createAnnouncement = async (req, res) => {
    const { title, body, audience, target_id, expires_at, is_pinned } = req.body;
    if (!title || !body || !audience) {
        return res.status(400).json({
            status: 'error',
            message: 'title, body, and audience are required.'
        });
    }
    const validAudiences = ['All','Students','Instructors','Program','Section','Department'];
    if (!validAudiences.includes(audience)) {
        return res.status(400).json({ status: 'error', message: 'Invalid audience.' });
    }
    if (['Program','Section','Department'].includes(audience) && !target_id) {
        return res.status(400).json({
            status: 'error',
            message: `target_id is required for audience '${audience}'.`
        });
    }

    // Instructors may only post to sections they teach
    if (req.user.role === 'Instructor') {
        if (audience !== 'Section') {
            return res.status(403).json({
                status: 'error',
                message: 'Instructors may only post Section-targeted announcements.'
            });
        }
        const [own] = await db.execute(
            `SELECT 1 FROM section WHERE section_id = ? AND instructor_id = ?`,
            [target_id, req.user.linked_id]
        );
        if (own.length === 0) {
            return res.status(403).json({ status: 'error', message: 'You do not teach this section.' });
        }
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [r] = await conn.execute(
            `INSERT INTO announcement
             (title, body, audience, target_id, posted_by_user_id, expires_at, is_pinned)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [title, body, audience, target_id || null, req.user.id,
             expires_at || null, !!is_pinned]
        );

        // Fan out notifications to the target audience
        const notifSql = `INSERT INTO notification (user_id, type, title, body, link) `;
        const link = `/announcements`;
        const nBody = title.slice(0, 200);

        if (audience === 'All') {
            await conn.execute(
                notifSql + `SELECT user_id, 'Announcement', ?, ?, ? FROM users`,
                [title, nBody, link]
            );
        } else if (audience === 'Students') {
            await conn.execute(
                notifSql + `SELECT user_id, 'Announcement', ?, ?, ? FROM users WHERE role = 'Student'`,
                [title, nBody, link]
            );
        } else if (audience === 'Instructors') {
            await conn.execute(
                notifSql + `SELECT user_id, 'Announcement', ?, ?, ? FROM users WHERE role = 'Instructor'`,
                [title, nBody, link]
            );
        } else if (audience === 'Program') {
            await conn.execute(
                notifSql + `SELECT u.user_id, 'Announcement', ?, ?, ?
                            FROM users u JOIN student s ON u.linked_id = s.student_id
                            WHERE u.role = 'Student' AND s.program_id = ?`,
                [title, nBody, link, target_id]
            );
        } else if (audience === 'Department') {
            await conn.execute(
                notifSql + `SELECT u.user_id, 'Announcement', ?, ?, ?
                            FROM users u JOIN student s ON u.linked_id = s.student_id
                            JOIN program p ON s.program_id = p.program_id
                            WHERE u.role = 'Student' AND p.department_id = ?`,
                [title, nBody, link, target_id]
            );
        } else if (audience === 'Section') {
            await conn.execute(
                notifSql + `SELECT u.user_id, 'Announcement', ?, ?, ?
                            FROM users u JOIN enrollment e ON u.linked_id = e.student_id
                            WHERE u.role = 'Student' AND e.section_id = ? AND e.status = 'Enrolled'`,
                [title, nBody, link, target_id]
            );
        }

        await conn.commit();
        res.status(201).json({
            status: 'success',
            data: { announcement_id: r.insertId },
            message: 'Announcement posted and notifications sent.'
        });
    } catch (e) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: e.message });
    } finally {
        conn.release();
    }
};

/** DELETE /announcements/:id — poster or Admin. */
exports.deleteAnnouncement = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT posted_by_user_id FROM announcement WHERE announcement_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Announcement not found.' });
        }
        if (req.user.role !== 'Admin' && rows[0].posted_by_user_id !== req.user.id) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only delete your own announcements.'
            });
        }
        await db.execute(`DELETE FROM announcement WHERE announcement_id = ?`, [req.params.id]);
        res.status(200).json({ status: 'success', message: 'Announcement deleted.' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
