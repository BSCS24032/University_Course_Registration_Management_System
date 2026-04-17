const db = require('../config/db');

exports.addCourse = async (req, res) => {
    const { course_code, name, description, credits, department_id, is_elective } = req.body;

    try {
        if (!course_code || !name || !credits || !department_id) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const [result] = await db.execute(
            `INSERT INTO course (course_code, name, description, credits, department_id, is_elective) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [course_code, name, description, credits, department_id, is_elective || 0]
        );

        res.status(201).json({
            success: true,
            message: "Course added successfully!",
            courseId: result.insertId
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "Course code already exists." });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const [depts] = await db.execute('SELECT department_id, name FROM department');
        res.status(200).json({ success: true, data: depts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};