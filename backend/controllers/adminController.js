const db = require('../config/db');

/* ============================================================================
 * DEPARTMENTS
 * ==========================================================================*/
exports.listDepartments = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM department ORDER BY name');
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.createDepartment = async (req, res) => {
    const { name, description, office_location, phone, email } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'name is required.' });
    try {
        const [r] = await db.execute(
            'INSERT INTO department (name, description, office_location, phone, email) VALUES (?, ?, ?, ?, ?)',
            [name, description || null, office_location || null, phone || null, email || null]
        );
        res.status(201).json({ status: 'success', data: { department_id: r.insertId } });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'Department name or email already exists.' });
        res.status(500).json({ status: 'error', message: e.message });
    }
};

exports.updateDepartment = async (req, res) => {
    const { name, description, office_location, phone, email } = req.body;
    try {
        await db.execute(
            `UPDATE department SET name = COALESCE(?, name), description = COALESCE(?, description),
             office_location = COALESCE(?, office_location), phone = COALESCE(?, phone),
             email = COALESCE(?, email) WHERE department_id = ?`,
            [name || null, description || null, office_location || null, phone || null, email || null, req.params.id]
        );
        res.status(200).json({ status: 'success', message: 'Department updated.' });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.deleteDepartment = async (req, res) => {
    try {
        await db.execute('DELETE FROM department WHERE department_id = ?', [req.params.id]);
        res.status(200).json({ status: 'success', message: 'Department deleted.' });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ status: 'error', message: 'Cannot delete: department still has programs, courses, or instructors.' });
        }
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/* ============================================================================
 * PROGRAMS
 * ==========================================================================*/
exports.listPrograms = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT p.*, d.name AS department_name FROM program p
             JOIN department d ON p.department_id = d.department_id ORDER BY p.name`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.createProgram = async (req, res) => {
    const { name, department_id, degree_type, duration_years, total_credits } = req.body;
    if (!name || !department_id || !degree_type || !duration_years || !total_credits) {
        return res.status(400).json({ status: 'error', message: 'All program fields are required.' });
    }
    try {
        const [r] = await db.execute(
            `INSERT INTO program (name, department_id, degree_type, duration_years, total_credits)
             VALUES (?, ?, ?, ?, ?)`,
            [name, department_id, degree_type, duration_years, total_credits]
        );
        res.status(201).json({ status: 'success', data: { program_id: r.insertId } });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.deleteProgram = async (req, res) => {
    try {
        await db.execute('DELETE FROM program WHERE program_id = ?', [req.params.id]);
        res.status(200).json({ status: 'success', message: 'Program deleted.' });
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ status: 'error', message: 'Cannot delete: program has students.' });
        }
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/* ============================================================================
 * PROGRAM ↔ COURSE MAPPING
 * Admin adds/removes course eligibility for a program.
 * ==========================================================================*/
exports.addProgramCourse = async (req, res) => {
    const { program_id, course_id, is_core, suggested_sem } = req.body;
    if (!program_id || !course_id) {
        return res.status(400).json({ status: 'error', message: 'program_id and course_id are required.' });
    }
    try {
        await db.execute(
            `INSERT INTO program_course (program_id, course_id, is_core, suggested_sem) VALUES (?, ?, ?, ?)`,
            [program_id, course_id, is_core === undefined ? true : is_core, suggested_sem || null]
        );
        res.status(201).json({ status: 'success', message: 'Course added to program.' });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'Course is already in this program.' });
        res.status(500).json({ status: 'error', message: e.message });
    }
};

exports.removeProgramCourse = async (req, res) => {
    const { program_id, course_id } = req.params;
    try {
        await db.execute('DELETE FROM program_course WHERE program_id = ? AND course_id = ?', [program_id, course_id]);
        res.status(200).json({ status: 'success', message: 'Course removed from program.' });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/* ============================================================================
 * INSTRUCTORS
 * ==========================================================================*/
exports.listInstructors = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT i.*, d.name AS department_name FROM instructor i
             JOIN department d ON i.department_id = d.department_id ORDER BY i.last_name, i.first_name`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.createInstructor = async (req, res) => {
    const { first_name, last_name, email, phone, department_id, hire_date, designation, salary } = req.body;
    if (!first_name || !last_name || !email || !department_id || !hire_date || !designation || salary === undefined) {
        return res.status(400).json({ status: 'error', message: 'Missing required instructor fields.' });
    }
    try {
        const [r] = await db.execute(
            `INSERT INTO instructor (first_name, last_name, email, phone, department_id, hire_date, designation, salary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [first_name, last_name, email, phone || null, department_id, hire_date, designation, salary]
        );
        res.status(201).json({ status: 'success', data: { instructor_id: r.insertId } });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ status: 'error', message: 'Email already in use.' });
        res.status(500).json({ status: 'error', message: e.message });
    }
};

exports.updateInstructor = async (req, res) => {
    const { phone, department_id, designation, salary, is_active } = req.body;
    try {
        await db.execute(
            `UPDATE instructor SET phone = COALESCE(?, phone), department_id = COALESCE(?, department_id),
             designation = COALESCE(?, designation), salary = COALESCE(?, salary),
             is_active = COALESCE(?, is_active) WHERE instructor_id = ?`,
            [phone || null, department_id || null, designation || null, salary || null,
             is_active === undefined ? null : is_active, req.params.id]
        );
        res.status(200).json({ status: 'success', message: 'Instructor updated.' });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/* ============================================================================
 * STUDENTS
 * ==========================================================================*/
exports.listStudents = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT s.student_id, s.first_name, s.last_name, s.email, s.gender, s.city,
                    s.program_id, p.name AS program_name, s.current_semester, s.credit_limit,
                    s.cgpa, s.status
             FROM student s JOIN program p ON s.program_id = p.program_id
             ORDER BY s.last_name, s.first_name`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.getStudent = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT s.*, p.name AS program_name
             FROM student s JOIN program p ON s.program_id = p.program_id
             WHERE s.student_id = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Student not found.' });
        res.status(200).json({ status: 'success', data: rows[0] });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

exports.updateStudent = async (req, res) => {
    const { phone, address, city, current_semester, status } = req.body;
    try {
        await db.execute(
            `UPDATE student SET phone = COALESCE(?, phone), address = COALESCE(?, address),
             city = COALESCE(?, city), current_semester = COALESCE(?, current_semester),
             status = COALESCE(?, status) WHERE student_id = ?`,
            [phone || null, address || null, city || null, current_semester || null,
             status || null, req.params.id]
        );
        res.status(200).json({ status: 'success', message: 'Student updated.' });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/**
 * PATCH /admin/students/:id/credit-limit
 * Admin-only — override a student's per-semester credit limit.
 * Body: { credit_limit: 21 }   (must be 0..30)
 */
exports.setCreditLimit = async (req, res) => {
    const { credit_limit } = req.body;
    if (credit_limit === undefined || credit_limit === null) {
        return res.status(400).json({ status: 'error', message: 'credit_limit is required.' });
    }
    const cl = Number(credit_limit);
    if (!Number.isInteger(cl) || cl < 0 || cl > 30) {
        return res.status(400).json({ status: 'error', message: 'credit_limit must be an integer between 0 and 30.' });
    }
    try {
        const [r] = await db.execute(
            'UPDATE student SET credit_limit = ? WHERE student_id = ?',
            [cl, req.params.id]
        );
        if (r.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Student not found.' });
        res.status(200).json({
            status: 'success',
            message: `Credit limit for student ${req.params.id} set to ${cl}.`,
            data: { student_id: Number(req.params.id), credit_limit: cl }
        });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};

/* ============================================================================
 * DASHBOARD STATS
 * ==========================================================================*/
exports.getStats = async (req, res) => {
    try {
        const [[counts]] = await db.execute(
            `SELECT
              (SELECT COUNT(*) FROM student WHERE status = 'Active') AS active_students,
              (SELECT COUNT(*) FROM instructor WHERE is_active = TRUE) AS active_instructors,
              (SELECT COUNT(*) FROM course) AS total_courses,
              (SELECT COUNT(*) FROM section) AS total_sections,
              (SELECT COUNT(*) FROM enrollment WHERE status = 'Enrolled') AS active_enrollments,
              (SELECT COUNT(*) FROM book) AS total_books,
              (SELECT SUM(available_copies) FROM book) AS available_copies,
              (SELECT COUNT(*) FROM book_issue WHERE return_date IS NULL) AS books_on_loan`
        );

        const [byDept] = await db.execute(
            `SELECT d.name AS department, COUNT(s.student_id) AS student_count,
                    ROUND(AVG(s.cgpa), 2) AS avg_cgpa
             FROM department d
             JOIN program p ON p.department_id = d.department_id
             LEFT JOIN student s ON s.program_id = p.program_id AND s.status = 'Active'
             GROUP BY d.department_id, d.name ORDER BY student_count DESC`
        );

        const [feeSummary] = await db.execute(
            `SELECT status, COUNT(*) AS voucher_count,
                    SUM(total_amount) AS total_billed,
                    SUM(paid_amount) AS total_collected
             FROM fee GROUP BY status`
        );

        const [topEnrolled] = await db.execute(
            `SELECT c.course_code, c.name, COUNT(e.enrollment_id) AS enrollment_count
             FROM course c
             JOIN section sec ON sec.course_id = c.course_id
             JOIN enrollment e ON e.section_id = sec.section_id AND e.status = 'Enrolled'
             GROUP BY c.course_id, c.course_code, c.name
             ORDER BY enrollment_count DESC LIMIT 5`
        );

        res.status(200).json({
            status: 'success',
            data: { counts, by_department: byDept, fee_summary: feeSummary, top_enrolled_courses: topEnrolled }
        });
    } catch (e) { res.status(500).json({ status: 'error', message: e.message }); }
};
