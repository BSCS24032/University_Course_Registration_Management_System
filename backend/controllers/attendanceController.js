const db = require('../config/db');

exports.markAttendance = async (req, res) => {
    const { section_id, date, records } = req.body;

    if (!section_id || !date || !records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ status: 'error', message: 'section_id, date, and a non-empty array of records are required.' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const record of records) {
            const { student_id, status } = record;
            
            if (!['Present', 'Absent', 'Late', 'Excused'].includes(status)) {
                throw new Error(`Invalid status '${status}' for student ${student_id}. Must be Present, Absent, Late, or Excused.`);
            }

            // Look up the enrollment_id for this student in this section
            const [enrollments] = await connection.execute(
                `SELECT enrollment_id FROM enrollment 
                 WHERE student_id = ? AND section_id = ? AND status = 'Enrolled'`,
                [student_id, section_id]
            );

            if (enrollments.length === 0) {
                throw new Error(`Student ${student_id} is not enrolled in section ${section_id}.`);
            }

            const enrollment_id = enrollments[0].enrollment_id;

            // Insert or update attendance using the correct columns
            await connection.execute(
                `INSERT INTO attendance (enrollment_id, attendance_date, status) 
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE status = VALUES(status)`, 
                [enrollment_id, date, status]
            );
        }

        await connection.commit();
        res.status(201).json({ status: 'success', message: 'Attendance marked successfully.' });

    } catch (error) {
        await connection.rollback();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        connection.release();
    }
};

exports.getMyAttendance = async (req, res) => {
    const student_id = req.user.linked_id;

    if (!student_id) {
        return res.status(400).json({ status: 'error', message: 'No linked student profile found for this account.' });
    }

    try {
        const [rows] = await db.execute(
            `SELECT a.attendance_date, a.status, c.course_code, c.name AS course_name,
                    sec.semester, sec.year
             FROM attendance a
             JOIN enrollment e ON a.enrollment_id = e.enrollment_id
             JOIN section sec ON e.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             WHERE e.student_id = ?
             ORDER BY a.attendance_date DESC`,
            [student_id]
        );

        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
