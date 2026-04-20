const db = require('../config/db');

const getAllCourses = async (req, res) => {
    try {
        const [courses] = await db.execute(
            `SELECT c.course_id, c.course_code, c.name, c.description, c.credits,
                    c.is_elective, d.name AS department_name
             FROM course c JOIN department d ON c.department_id = d.department_id`
        );
        res.status(200).json({ status: 'success', results: courses.length, data: courses });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getAllSections = async (req, res) => {
    try {
        const [sections] = await db.execute(
            `SELECT s.section_id, s.course_id, s.semester, s.year, s.schedule_days, s.schedule_time,
                    s.room, s.capacity, s.enrolled_count, c.course_code, c.name AS course_name, c.credits,
                    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name
             FROM section s
             JOIN course c ON s.course_id = c.course_id
             JOIN instructor i ON s.instructor_id = i.instructor_id
             ORDER BY s.year DESC, s.semester DESC, c.course_code`
        );
        res.status(200).json({ status: 'success', data: sections });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /courses/eligible  —  Student only.
 * Returns courses the logged-in student's program allows, using the Phase-1 view
 * vw_student_eligible_courses, left-joined to open sections so the frontend can
 * immediately show what's available to enroll in.
 */
const getMyEligibleCourses = async (req, res) => {
    const student_id = req.user.linked_id;
    if (!student_id) return res.status(400).json({ status: 'error', message: 'No linked student profile.' });

    try {
        const [rows] = await db.execute(
            `SELECT ec.course_id, ec.course_code, ec.course_name, ec.credits, ec.is_core, ec.suggested_sem,
                    s.section_id, s.semester, s.year, s.schedule_days, s.schedule_time,
                    (s.capacity - s.enrolled_count) AS seats_available,
                    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name
             FROM vw_student_eligible_courses ec
             LEFT JOIN section s ON ec.course_id = s.course_id
             LEFT JOIN instructor i ON s.instructor_id = i.instructor_id
             WHERE ec.student_id = ?
             ORDER BY ec.suggested_sem, ec.course_code`,
            [student_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/** List prerequisites for a course. */
const getCoursePrerequisites = async (req, res) => {
    const { course_id } = req.params;
    try {
        const [rows] = await db.execute(
            `SELECT c.course_id, c.course_code, c.name
             FROM course_prerequisite cp
             JOIN course c ON cp.prerequisite_id = c.course_id
             WHERE cp.course_id = ?`,
            [course_id]
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getAllCourses, getAllSections, getMyEligibleCourses, getCoursePrerequisites };
