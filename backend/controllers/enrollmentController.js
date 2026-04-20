const db = require('../config/db');

/**
 * ACID Transaction: Enroll a student in a section.
 * Enforces, in order:
 *   1. Ownership (students can only enroll themselves)
 *   2. Semester registration window is open
 *   3. Section capacity (if full, suggests waitlist)
 *   4. No duplicate enrollment
 *   5. Program-course eligibility
 *   6. Credit-hour limit
 *   7. Prerequisites completed
 */
const enrollStudent = async (req, res) => {
    const { student_id, section_id } = req.body;

    if (!student_id || !section_id) {
        return res.status(400).json({ status: 'error', message: 'student_id and section_id are required.' });
    }

    if (req.user.role === 'Student') {
        if (!req.user.linked_id || req.user.linked_id !== student_id) {
            return res.status(403).json({ status: 'error', message: 'Students can only enroll themselves.' });
        }
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        console.log(`\n--- Transaction Started: Enroll Student ${student_id} in Section ${section_id} ---`);

        // 2. Semester window check
        const [sems] = await conn.execute(
            `SELECT semester_id, term, year, registration_open, registration_close
             FROM semester WHERE status = 'Active' LIMIT 1`
        );
        if (sems.length === 0) {
            throw new Error('No active semester — enrollment is closed.');
        }
        const active = sems[0];
        const today = new Date().toISOString().slice(0, 10);
        if (today < active.registration_open.toISOString().slice(0, 10)) {
            throw new Error(`Registration opens on ${active.registration_open.toISOString().slice(0,10)} for ${active.term} ${active.year}.`);
        }
        if (today > active.registration_close.toISOString().slice(0, 10)) {
            throw new Error(`Registration closed on ${active.registration_close.toISOString().slice(0,10)} for ${active.term} ${active.year}.`);
        }
        console.log('  ✓ Semester window check passed');

        const [sections] = await conn.execute(
            `SELECT s.section_id, s.course_id, s.capacity, s.enrolled_count,
                    s.semester, s.year, c.credits, c.course_code, c.name
             FROM section s JOIN course c ON s.course_id = c.course_id
             WHERE s.section_id = ? FOR UPDATE`,
            [section_id]
        );
        if (sections.length === 0) throw new Error('Section not found.');
        const sec = sections[0];

        // Section must belong to the active semester
        if (sec.semester !== active.term || sec.year !== active.year) {
            throw new Error(`This section is for ${sec.semester} ${sec.year}, not the current registration period.`);
        }

        if (sec.enrolled_count >= sec.capacity) {
            throw new Error('SECTION_FULL: This section is full. You may join the waitlist.');
        }
        console.log('  ✓ Capacity check passed');

        const [students] = await conn.execute(
            'SELECT program_id, credit_limit, status FROM student WHERE student_id = ? FOR UPDATE',
            [student_id]
        );
        if (students.length === 0) throw new Error('Student not found.');
        const stu = students[0];

        if (stu.status !== 'Active') throw new Error(`Cannot enroll: student status is '${stu.status}'.`);
        if (stu.credit_limit === 0) throw new Error('Your credit limit is 0. Contact the Admin office.');

        const [dup] = await conn.execute(
            'SELECT enrollment_id FROM enrollment WHERE student_id = ? AND section_id = ?',
            [student_id, section_id]
        );
        if (dup.length > 0) throw new Error('Student is already enrolled in this section.');
        console.log('  ✓ Duplicate check passed');

        const [eligibility] = await conn.execute(
            'SELECT 1 FROM program_course WHERE program_id = ? AND course_id = ?',
            [stu.program_id, sec.course_id]
        );
        if (eligibility.length === 0) {
            throw new Error(`Course ${sec.course_code} (${sec.name}) is not part of your program.`);
        }
        console.log('  ✓ Program eligibility check passed');

        const [loadRows] = await conn.execute(
            `SELECT COALESCE(SUM(c.credits), 0) AS current_credits
             FROM enrollment e
             JOIN section s ON e.section_id = s.section_id
             JOIN course c ON s.course_id = c.course_id
             WHERE e.student_id = ? AND e.status = 'Enrolled'`,
            [student_id]
        );
        const current = Number(loadRows[0].current_credits);
        const proposed = current + Number(sec.credits);
        if (proposed > stu.credit_limit) {
            throw new Error(
                `Credit-limit exceeded. Your limit is ${stu.credit_limit} credits; you currently hold ${current} and this course is ${sec.credits}, totalling ${proposed}.`
            );
        }
        console.log(`  ✓ Credit-limit check passed (${proposed}/${stu.credit_limit})`);

        const [prereqs] = await conn.execute(
            'SELECT prerequisite_id FROM course_prerequisite WHERE course_id = ?',
            [sec.course_id]
        );
        if (prereqs.length > 0) {
            const prereqIds = prereqs.map(p => p.prerequisite_id);
            const placeholders = prereqIds.map(() => '?').join(',');
            const [completed] = await conn.execute(
                `SELECT DISTINCT sec.course_id
                 FROM enrollment e JOIN section sec ON e.section_id = sec.section_id
                 WHERE e.student_id = ? AND e.status = 'Completed' AND sec.course_id IN (${placeholders})`,
                [student_id, ...prereqIds]
            );
            const completedIds = completed.map(c => c.course_id);
            const missing = prereqIds.filter(id => !completedIds.includes(id));
            if (missing.length > 0) {
                const [names] = await conn.execute(
                    `SELECT course_code, name FROM course WHERE course_id IN (${missing.map(() => '?').join(',')})`,
                    missing
                );
                const list = names.map(c => `${c.course_code} (${c.name})`).join(', ');
                throw new Error(`Missing prerequisite(s): ${list}`);
            }
            console.log('  ✓ Prerequisite check passed');
        }

        const [result] = await conn.execute(
            'INSERT INTO enrollment (student_id, section_id, enrollment_date, status) VALUES (?, ?, CURDATE(), ?)',
            [student_id, section_id, 'Enrolled']
        );

        // Notify the student of successful enrollment
        const [[userRow]] = await conn.execute(
            `SELECT user_id FROM users WHERE role = 'Student' AND linked_id = ? LIMIT 1`,
            [student_id]
        );
        if (userRow) {
            await conn.execute(
                `INSERT INTO notification (user_id, type, title, body, link)
                 VALUES (?, 'General', ?, ?, '/enrollment')`,
                [userRow.user_id,
                 'Enrollment confirmed',
                 `You are now enrolled in ${sec.course_code} — ${sec.name}.`]
            );
        }

        await conn.commit();
        console.log('--- Transaction Committed Successfully ---\n');

        res.status(201).json({
            status: 'success',
            message: 'Student successfully enrolled.',
            data: { enrollment_id: result.insertId, credits_remaining: stu.credit_limit - proposed }
        });
    } catch (error) {
        await conn.rollback();
        console.error('--- TRANSACTION ROLLED BACK ---', error.message, '\n');
        // Surface SECTION_FULL as a 409 so the frontend can offer waitlist
        const status = error.message.startsWith('SECTION_FULL') ? 409 : 400;
        res.status(status).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/** Drop an enrollment. Trigger decrements enrolled_count and auto-promotes waitlist. */
const dropEnrollment = async (req, res) => {
    const { enrollment_id } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.execute(
            'SELECT student_id, section_id, status FROM enrollment WHERE enrollment_id = ? FOR UPDATE',
            [enrollment_id]
        );
        if (rows.length === 0) throw new Error('Enrollment not found.');
        const enr = rows[0];

        if (req.user.role === 'Student' && req.user.linked_id !== enr.student_id) {
            throw new Error('Students can only drop their own enrollments.');
        }
        if (enr.status !== 'Enrolled') throw new Error(`Cannot drop: current status is '${enr.status}'.`);

        // Check add/drop deadline for Student role
        if (req.user.role === 'Student') {
            const [sems] = await conn.execute(
                `SELECT add_drop_deadline FROM semester WHERE status = 'Active' LIMIT 1`
            );
            if (sems.length > 0) {
                const today = new Date().toISOString().slice(0, 10);
                const deadline = sems[0].add_drop_deadline.toISOString().slice(0, 10);
                if (today > deadline) {
                    throw new Error(`Add/drop deadline has passed (${deadline}). Submit a formal withdrawal instead.`);
                }
            }
        }

        await conn.execute("UPDATE enrollment SET status = 'Dropped' WHERE enrollment_id = ?", [enrollment_id]);
        await conn.commit();
        res.status(200).json({ status: 'success', message: 'Enrollment dropped. If anyone was waitlisted, the top entry has been promoted.' });
    } catch (error) {
        await conn.rollback();
        res.status(400).json({ status: 'error', message: error.message });
    } finally {
        conn.release();
    }
};

/** List current user's enrollments. */
const getMyEnrollments = async (req, res) => {
    try {
        const student_id = req.user.linked_id;
        if (!student_id) {
            return res.status(400).json({ status: 'error', message: 'No linked student profile.' });
        }
        const [rows] = await db.execute(
            `SELECT e.enrollment_id, e.status, e.grade, e.grade_points, e.enrollment_date,
                    sec.section_id, sec.semester, sec.year, sec.schedule_days, sec.schedule_time, sec.room,
                    c.course_code, c.name AS course_name, c.credits,
                    CONCAT(i.first_name,' ',i.last_name) AS instructor_name
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             JOIN course c ON sec.course_id = c.course_id
             JOIN instructor i ON sec.instructor_id = i.instructor_id
             WHERE e.student_id = ?
             ORDER BY sec.year DESC, FIELD(sec.semester,'Spring','Summer','Fall'), c.course_code`,
            [student_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

module.exports = { enrollStudent, dropEnrollment, getMyEnrollments };
