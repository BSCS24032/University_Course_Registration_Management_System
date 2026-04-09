const db = require('../config/db');

const enrollStudent = async (req, res) => {
    const { student_id, section_id } = req.body;
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const [sections] = await conn.execute(
            'SELECT capacity, enrolled_count FROM section WHERE section_id = ? FOR UPDATE',
            [section_id]
        );

        if (sections.length === 0) {
            throw new Error('Section not found');
        }
        
        if (sections[0].enrolled_count >= sections[0].capacity) {
            throw new Error('Section is at full capacity');
        }

        const [existingEnrollment] = await conn.execute(
            'SELECT * FROM enrollment WHERE student_id = ? AND section_id = ?',
            [student_id, section_id]
        );

        if (existingEnrollment.length > 0) {
            throw new Error('Student is already enrolled in this section');
        }

        await conn.execute(
            'INSERT INTO enrollment (student_id, section_id, enrollment_date, status) VALUES (?, ?, CURDATE(), ?)',
            [student_id, section_id, 'Enrolled']
        );

        await conn.commit();
        
        res.status(201).json({ 
            status: 'success', 
            message: 'Student successfully enrolled.' 
        });

    } catch (error) {
        await conn.rollback();
        res.status(400).json({ 
            status: 'error', 
            message: error.message 
        });
    } finally {
        conn.release();
    }
};

module.exports = { enrollStudent };