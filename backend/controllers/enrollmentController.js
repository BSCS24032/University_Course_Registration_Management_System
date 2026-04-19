const db = require('../config/db');

const enrollStudent = async (req, res) => {
    const { student_id, section_id } = req.body;

    // Ownership check: Students can only enroll themselves
    if (req.user.role === 'Student') {
        const linkedId = req.user.linked_id;
        if (!linkedId || linkedId !== student_id) {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Students can only enroll themselves.' 
            });
        }
    }

    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();
        console.log(`\n--- Transaction Started: Enroll Student ${student_id} in Section ${section_id} ---`);

        // 1. Lock section row and check capacity
        const [sections] = await conn.execute(
            'SELECT capacity, enrolled_count FROM section WHERE section_id = ? FOR UPDATE',
            [section_id]
        );

        if (sections.length === 0) {
            throw new Error('Section not found.');
        }
        
        if (sections[0].enrolled_count >= sections[0].capacity) {
            throw new Error('Section is at full capacity.');
        }
        console.log('  ✓ Capacity check passed');

        // 2. Check for duplicate enrollment
        const [existingEnrollment] = await conn.execute(
            'SELECT enrollment_id FROM enrollment WHERE student_id = ? AND section_id = ?',
            [student_id, section_id]
        );

        if (existingEnrollment.length > 0) {
            throw new Error('Student is already enrolled in this section.');
        }
        console.log('  ✓ Duplicate check passed');

        // 3. Check prerequisites — get the course for this section
        const [sectionCourse] = await conn.execute(
            'SELECT course_id FROM section WHERE section_id = ?',
            [section_id]
        );
        const courseId = sectionCourse[0].course_id;

        const [prereqs] = await conn.execute(
            'SELECT prerequisite_id FROM course_prerequisite WHERE course_id = ?',
            [courseId]
        );

        if (prereqs.length > 0) {
            const prereqIds = prereqs.map(p => p.prerequisite_id);
            const placeholders = prereqIds.map(() => '?').join(',');
            
            const [completed] = await conn.execute(
                `SELECT DISTINCT sec.course_id 
                 FROM enrollment e 
                 JOIN section sec ON e.section_id = sec.section_id 
                 WHERE e.student_id = ? AND e.status = 'Completed' AND sec.course_id IN (${placeholders})`,
                [student_id, ...prereqIds]
            );

            const completedIds = completed.map(c => c.course_id);
            const missing = prereqIds.filter(id => !completedIds.includes(id));

            if (missing.length > 0) {
                const [missingNames] = await conn.execute(
                    `SELECT course_code, name FROM course WHERE course_id IN (${missing.map(() => '?').join(',')})`,
                    missing
                );
                const names = missingNames.map(c => `${c.course_code} (${c.name})`).join(', ');
                throw new Error(`Missing prerequisite(s): ${names}`);
            }
            console.log('  ✓ Prerequisite check passed');
        }

        // 4. Insert enrollment — trigger auto-increments enrolled_count
        await conn.execute(
            'INSERT INTO enrollment (student_id, section_id, enrollment_date, status) VALUES (?, ?, CURDATE(), ?)',
            [student_id, section_id, 'Enrolled']
        );
        console.log('  ✓ Enrollment record inserted');

        await conn.commit();
        console.log('--- Transaction Committed Successfully ---\n');

        res.status(201).json({ 
            status: 'success', 
            message: 'Student successfully enrolled.' 
        });

    } catch (error) {
        await conn.rollback();
        console.error('--- TRANSACTION ROLLED BACK ---', error.message, '\n');
        res.status(400).json({ 
            status: 'error', 
            message: error.message 
        });
    } finally {
        conn.release();
    }
};

module.exports = { enrollStudent };
