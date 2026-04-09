const db = require('../config/db');

exports.markAttendance = async (req, res) => {
    const { section_id, date, records } = req.body;

    if (!section_id || !date || !records || !Array.isArray(records)) {
        return res.status(400).json({ message: "section_id, date, and an array of records are required." });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const record of records) {
            const { student_id, status } = record;
            
            if (status !== 'Present' && status !== 'Absent') {
                throw new Error(`Invalid status '${status}' for student ${student_id}`);
            }

            await connection.execute(
                `INSERT INTO attendance (section_id, student_id, date, status) 
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = ?`, 
                [section_id, student_id, date, status, status]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Attendance marked successfully." });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ message: "Failed to mark attendance. Rolled back.", error: error.message });
    } finally {
        connection.release();
    }
};

exports.getMyAttendance = async (req, res) => {
    const student_id = req.user.id || req.user.student_id || req.user.userId || req.user.user_id; 

    if (!student_id) {
        return res.status(400).json({ 
            message: "Missing ID in token! Here is what your token actually contains: " + JSON.stringify(req.user) 
        });
    }

    try {
        const [rows] = await db.execute(
            `SELECT a.date, a.status, s.course_name 
             FROM attendance a
             JOIN sections s ON a.section_id = s.section_id 
             WHERE a.student_id = ?
             ORDER BY a.date DESC`,
            [student_id]
        );

        res.status(200).json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};