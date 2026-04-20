const db = require('../config/db');

/** POST /waitlist — student joins the waitlist for a full section.
 *  Checks: section actually full, not already enrolled, not already waitlisted,
 *          course is in student's program (same rule as enrollment).
 *  ACID: section row is locked so position numbering is deterministic. */
exports.joinWaitlist = async (req, res) => {
    const { section_id } = req.body;
    if (!section_id) {
        return res.status(400).json({ status: 'error', message: 'section_id is required.' });
    }
    if (req.user.role !== 'Student') {
        return res.status(403).json({ status: 'error', message: 'Only students can join waitlists.' });
    }
    const student_id = req.user.linked_id;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [secs] = await conn.execute(
            `SELECT s.section_id, s.capacity, s.enrolled_count, s.course_id
             FROM section s WHERE s.section_id = ? FOR UPDATE`,
            [section_id]
        );
        if (secs.length === 0) throw new Error('Section not found.');
        const sec = secs[0];
        if (sec.enrolled_count < sec.capacity) {
            throw new Error('Section is not full — please enroll directly instead of waitlisting.');
        }

        const [[stu]] = await conn.execute(
            `SELECT program_id FROM student WHERE student_id = ?`, [student_id]
        );
        const [elig] = await conn.execute(
            `SELECT 1 FROM program_course WHERE program_id = ? AND course_id = ?`,
            [stu.program_id, sec.course_id]
        );
        if (elig.length === 0) throw new Error('This course is not part of your program.');

        const [already] = await conn.execute(
            `SELECT 1 FROM enrollment WHERE student_id = ? AND section_id = ? AND status = 'Enrolled'`,
            [student_id, section_id]
        );
        if (already.length > 0) throw new Error('You are already enrolled in this section.');

        const [dup] = await conn.execute(
            `SELECT status FROM waitlist WHERE student_id = ? AND section_id = ?`,
            [student_id, section_id]
        );
        if (dup.length > 0 && dup[0].status === 'Waiting') {
            throw new Error('You are already on this waitlist.');
        }

        // Compute next position
        const [[pos]] = await conn.execute(
            `SELECT COALESCE(MAX(position), 0) + 1 AS next_pos
             FROM waitlist WHERE section_id = ? AND status = 'Waiting'`,
            [section_id]
        );

        if (dup.length > 0) {
            await conn.execute(
                `UPDATE waitlist SET status = 'Waiting', position = ?, joined_at = NOW()
                 WHERE student_id = ? AND section_id = ?`,
                [pos.next_pos, student_id, section_id]
            );
        } else {
            await conn.execute(
                `INSERT INTO waitlist (student_id, section_id, position) VALUES (?, ?, ?)`,
                [student_id, section_id, pos.next_pos]
            );
        }

        await conn.commit();
        res.status(201).json({
            status: 'success',
            message: `Added to waitlist at position ${pos.next_pos}.`,
            data: { position: pos.next_pos }
        });
    } catch (e) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: e.message });
    } finally {
        conn.release();
    }
};

/** GET /waitlist/my — student's waitlist entries. */
exports.getMyWaitlist = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT w.*, c.course_code, c.name AS course_name,
                    sec.semester, sec.year
             FROM waitlist w
             JOIN section sec ON w.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             WHERE w.student_id = ? AND w.status = 'Waiting'
             ORDER BY w.joined_at DESC`,
            [req.user.linked_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** DELETE /waitlist/:id — student cancels, positions behind are decremented. */
exports.cancelWaitlist = async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            `SELECT student_id, section_id, position, status
             FROM waitlist WHERE waitlist_id = ? FOR UPDATE`,
            [req.params.id]
        );
        if (rows.length === 0) throw new Error('Waitlist entry not found.');
        const entry = rows[0];
        if (req.user.role === 'Student' && entry.student_id !== req.user.linked_id) {
            throw new Error('You can only cancel your own waitlist entry.');
        }
        if (entry.status !== 'Waiting') {
            throw new Error(`Cannot cancel — current status is '${entry.status}'.`);
        }

        await conn.execute(
            `UPDATE waitlist SET status = 'Cancelled' WHERE waitlist_id = ?`,
            [req.params.id]
        );
        // Shift positions behind this one
        await conn.execute(
            `UPDATE waitlist SET position = position - 1
             WHERE section_id = ? AND status = 'Waiting' AND position > ?`,
            [entry.section_id, entry.position]
        );
        await conn.commit();
        res.status(200).json({ status: 'success', message: 'Waitlist entry cancelled.' });
    } catch (e) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: e.message });
    } finally {
        conn.release();
    }
};

/** GET /waitlist/section/:id — admin/instructor view. */
exports.getSectionWaitlist = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT w.*, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    s.email
             FROM waitlist w
             JOIN student s ON w.student_id = s.student_id
             WHERE w.section_id = ? AND w.status = 'Waiting'
             ORDER BY w.position`,
            [req.params.id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
