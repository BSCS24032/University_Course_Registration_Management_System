const db = require('../config/db');

exports.getAllBooks = async (req, res) => {
    try {
        const [books] = await db.execute('SELECT * FROM book ORDER BY title');
        res.status(200).json({ status: 'success', results: books.length, data: books });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM book WHERE book_id = ?', [req.params.book_id]);
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Book not found.' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.createBook = async (req, res) => {
    const { title, author, isbn, publisher, publish_year, category, total_copies } = req.body;
    if (!title || !author || !isbn) {
        return res.status(400).json({ status: 'error', message: 'title, author, and isbn are required.' });
    }
    try {
        const copies = total_copies || 1;
        const [result] = await db.execute(
            `INSERT INTO book (title, author, isbn, publisher, publish_year, category, total_copies, available_copies)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, author, isbn, publisher || null, publish_year || null, category || null, copies, copies]
        );
        res.status(201).json({ status: 'success', data: { book_id: result.insertId } });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'A book with this ISBN already exists.' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.updateBook = async (req, res) => {
    const { book_id } = req.params;
    const { title, author, publisher, publish_year, category, total_copies } = req.body;
    try {
        // If total_copies is changing, ensure we don't drop below currently-issued count
        if (total_copies !== undefined) {
            const [cur] = await db.execute(
                'SELECT total_copies, available_copies FROM book WHERE book_id = ?', [book_id]
            );
            if (cur.length === 0) return res.status(404).json({ status: 'error', message: 'Book not found.' });
            const issued = cur[0].total_copies - cur[0].available_copies;
            if (total_copies < issued) {
                return res.status(400).json({
                    status: 'error',
                    message: `Cannot set total_copies below currently-issued count (${issued}).`
                });
            }
            const newAvailable = total_copies - issued;
            await db.execute(
                `UPDATE book SET title = COALESCE(?, title), author = COALESCE(?, author),
                 publisher = COALESCE(?, publisher), publish_year = COALESCE(?, publish_year),
                 category = COALESCE(?, category), total_copies = ?, available_copies = ?
                 WHERE book_id = ?`,
                [title || null, author || null, publisher || null, publish_year || null,
                 category || null, total_copies, newAvailable, book_id]
            );
        } else {
            await db.execute(
                `UPDATE book SET title = COALESCE(?, title), author = COALESCE(?, author),
                 publisher = COALESCE(?, publisher), publish_year = COALESCE(?, publish_year),
                 category = COALESCE(?, category) WHERE book_id = ?`,
                [title || null, author || null, publisher || null, publish_year || null,
                 category || null, book_id]
            );
        }
        res.status(200).json({ status: 'success', message: 'Book updated.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        await db.execute('DELETE FROM book WHERE book_id = ?', [req.params.book_id]);
        res.status(200).json({ status: 'success', message: 'Book deleted.' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete: book has active issue records.'
            });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};
