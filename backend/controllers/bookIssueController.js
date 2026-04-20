const db = require('../config/db');

/**
 * ACID Transaction: Issue a book to a student.
 * The Phase-1 trigger trg_before_book_issue_insert decrements available_copies
 * and throws if no copies are available, so the transaction will rollback cleanly.
 */
exports.issueBook = async (req, res) => {
    const { book_id, student_id, due_days } = req.body;
    if (!book_id || !student_id) {
        return res.status(400).json({ status: 'error', message: 'book_id and student_id are required.' });
    }
    const days = (due_days && due_days > 0) ? Math.min(due_days, 60) : 14;

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        console.log(`\n--- Transaction: Issue book ${book_id} to student ${student_id} ---`);

        // Lock the book row — trigger will re-check but locking avoids race
        const [books] = await conn.execute(
            'SELECT available_copies, title FROM book WHERE book_id = ? FOR UPDATE', [book_id]
        );
        if (books.length === 0) throw new Error('Book not found.');

        const [students] = await conn.execute(
            `SELECT status FROM student WHERE student_id = ?`, [student_id]
        );
        if (students.length === 0) throw new Error('Student not found.');
        if (students[0].status === 'Suspended' || students[0].status === 'Withdrawn') {
            throw new Error(`Cannot issue book to a ${students[0].status} student.`);
        }

        // Cap: no more than 5 concurrent active issues per student
        const [active] = await conn.execute(
            'SELECT COUNT(*) AS cnt FROM book_issue WHERE student_id = ? AND return_date IS NULL',
            [student_id]
        );
        if (Number(active[0].cnt) >= 5) {
            throw new Error('Student already has 5 active book issues (maximum reached).');
        }

        // Block new issues if student has unpaid overdue fines
        const [fines] = await conn.execute(
            'SELECT SUM(fine) AS total FROM book_issue WHERE student_id = ? AND fine > 0 AND return_date IS NOT NULL',
            [student_id]
        );
        // We'd track paid fines in another table in production; for now, just warn via log.
        if (Number(fines[0].total || 0) > 0) {
            console.log(`  (Student has ${fines[0].total} in historical fines)`);
        }

        const [result] = await conn.execute(
            `INSERT INTO book_issue (book_id, student_id, issue_date, due_date)
             VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY))`,
            [book_id, student_id, days]
        );

        await conn.commit();
        console.log('--- Committed ---\n');
        res.status(201).json({
            status: 'success',
            message: `Book "${books[0].title}" issued.`,
            data: { issue_id: result.insertId, due_in_days: days }
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
 * ACID Transaction: Return a book.
 * The Phase-1 trigger trg_after_book_return increments available_copies and
 * auto-calculates the fine (10 per day late). We just set return_date.
 */
exports.returnBook = async (req, res) => {
    const { issue_id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.execute(
            'SELECT * FROM book_issue WHERE issue_id = ? FOR UPDATE', [issue_id]
        );
        if (rows.length === 0) throw new Error('Issue record not found.');
        if (rows[0].return_date !== null) throw new Error('This book has already been returned.');

        await conn.execute(
            'UPDATE book_issue SET return_date = CURDATE() WHERE issue_id = ?', [issue_id]
        );

        // Read back the fine the trigger computed
        const [updated] = await conn.execute(
            'SELECT fine, return_date, due_date FROM book_issue WHERE issue_id = ?', [issue_id]
        );

        await conn.commit();
        res.status(200).json({
            status: 'success',
            message: 'Book returned.',
            data: updated[0]
        });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/** GET /book-issues — list all issues (Librarian/Admin). Supports ?active=true filter. */
exports.listIssues = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';
        const [rows] = await db.execute(
            `SELECT bi.issue_id, bi.book_id, b.title, b.author,
                    bi.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name,
                    bi.issue_date, bi.due_date, bi.return_date, bi.fine
             FROM book_issue bi
             JOIN book b ON bi.book_id = b.book_id
             JOIN student s ON bi.student_id = s.student_id
             ${activeOnly ? 'WHERE bi.return_date IS NULL' : ''}
             ORDER BY bi.issue_date DESC`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** GET /book-issues/my — a student's own borrowing history. */
exports.getMyIssues = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });
    try {
        const [rows] = await db.execute(
            `SELECT bi.issue_id, b.title, b.author, bi.issue_date, bi.due_date,
                    bi.return_date, bi.fine
             FROM book_issue bi JOIN book b ON bi.book_id = b.book_id
             WHERE bi.student_id = ? ORDER BY bi.issue_date DESC`,
            [student_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
