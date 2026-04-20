const db = require('../config/db');

/** GET /admin/probation — students with CGPA below 2.0 (view-backed). */
exports.getProbationList = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT * FROM vw_academic_probation ORDER BY cgpa ASC`);
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /admin/enrollment-trend — enrollments per semester, for the dashboard line/bar. */
exports.getEnrollmentTrend = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT sec.semester, sec.year,
                    COUNT(e.enrollment_id) AS enrollments
             FROM enrollment e
             JOIN section sec ON e.section_id = sec.section_id
             WHERE e.status IN ('Enrolled','Completed')
             GROUP BY sec.year, sec.semester
             ORDER BY sec.year, FIELD(sec.semester,'Spring','Summer','Fall')`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /admin/feedback-overview — top and bottom rated instructors (aggregate only). */
exports.getFeedbackOverview = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT i.instructor_id,
                    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
                    d.name AS department,
                    COUNT(f.feedback_id) AS response_count,
                    ROUND(AVG((f.rating_teaching + f.rating_content + f.rating_fairness) / 3), 2)
                        AS avg_overall
             FROM instructor i
             LEFT JOIN feedback f ON f.instructor_id = i.instructor_id
             LEFT JOIN department d ON i.department_id = d.department_id
             WHERE i.is_active = TRUE
             GROUP BY i.instructor_id, i.first_name, i.last_name, d.name
             HAVING response_count > 0
             ORDER BY avg_overall DESC`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};

/** GET /admin/section-fill — capacity utilization across sections. */
exports.getSectionFillRates = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT sec.section_id, c.course_code, c.name AS course_name,
                    sec.semester, sec.year, sec.capacity, sec.enrolled_count,
                    ROUND(sec.enrolled_count * 100.0 / sec.capacity, 1) AS fill_pct,
                    (SELECT COUNT(*) FROM waitlist w
                     WHERE w.section_id = sec.section_id AND w.status = 'Waiting') AS waitlist_size
             FROM section sec
             JOIN course c ON sec.course_id = c.course_id
             ORDER BY fill_pct DESC
             LIMIT 10`
        );
        res.status(200).json({ status: 'success', data: rows });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
