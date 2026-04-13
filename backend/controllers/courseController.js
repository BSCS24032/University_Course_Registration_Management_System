const db = require('../config/db');

const getAllCourses = async (req, res) => {
    try {
        const [courses] = await db.execute('SELECT * FROM course');
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAllSections = async (req, res) => {
    try {
        const [sections] = await db.execute(`
            SELECT 
                s.section_id, 
                CONCAT(s.semester, ' ', s.year) AS section_name, 
                s.capacity, 
                s.enrolled_count, 
                c.name AS course_name 
            FROM section s
            JOIN course c ON s.course_id = c.course_id
        `);
        
        res.status(200).json({
            status: 'success',
            data: sections
        });
    } catch (error) {
        console.error("SQL Error:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getAllCourses, getAllSections };