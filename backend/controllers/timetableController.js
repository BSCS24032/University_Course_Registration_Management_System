const db = require('../config/db');

/** Expand 'Mon/Wed' style schedule_days into an array of weekday codes. */
const DAY_MAP = {
    'mon': 'Monday', 'tue': 'Tuesday', 'wed': 'Wednesday',
    'thu': 'Thursday', 'fri': 'Friday', 'sat': 'Saturday', 'sun': 'Sunday'
};
function normaliseDays(daysStr) {
    if (!daysStr) return [];
    return daysStr.split(/[\/,\s]+/).map(d => {
        const key = d.trim().toLowerCase().slice(0, 3);
        return DAY_MAP[key] || null;
    }).filter(Boolean);
}

/** GET /timetable/my — student's enrolled sections OR instructor's taught sections,
 *  expanded into a weekly grid-friendly format. */
exports.getMyTimetable = async (req, res) => {
    try {
        let rows;
        if (req.user.role === 'Student') {
            [rows] = await db.execute(
                `SELECT sec.section_id, c.course_code, c.name AS course_name,
                        sec.schedule_days, sec.schedule_time, sec.room,
                        CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
                        sec.semester, sec.year
                 FROM enrollment e
                 JOIN section sec ON e.section_id = sec.section_id
                 JOIN course c ON sec.course_id = c.course_id
                 JOIN instructor i ON sec.instructor_id = i.instructor_id
                 WHERE e.student_id = ? AND e.status = 'Enrolled'`,
                [req.user.linked_id]
            );
        } else if (req.user.role === 'Instructor') {
            [rows] = await db.execute(
                `SELECT sec.section_id, c.course_code, c.name AS course_name,
                        sec.schedule_days, sec.schedule_time, sec.room,
                        CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
                        sec.semester, sec.year, sec.capacity, sec.enrolled_count
                 FROM section sec
                 JOIN course c ON sec.course_id = c.course_id
                 JOIN instructor i ON sec.instructor_id = i.instructor_id
                 WHERE sec.instructor_id = ?`,
                [req.user.linked_id]
            );
        } else {
            return res.status(403).json({
                status: 'error',
                message: 'Timetable view is for students and instructors only.'
            });
        }

        // Expand each section into one entry per meeting day
        const meetings = [];
        for (const r of rows) {
            for (const day of normaliseDays(r.schedule_days)) {
                meetings.push({
                    section_id: r.section_id,
                    course_code: r.course_code,
                    course_name: r.course_name,
                    day,
                    time: r.schedule_time,
                    room: r.room,
                    instructor_name: r.instructor_name,
                    semester: r.semester,
                    year: r.year,
                    capacity: r.capacity,
                    enrolled_count: r.enrolled_count
                });
            }
        }

        res.status(200).json({
            status: 'success',
            data: { meetings, sections: rows }
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
};
