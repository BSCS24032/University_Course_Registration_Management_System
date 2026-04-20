-- ============================================================================
-- UNIVERSITY MANAGEMENT SYSTEM (UMS)
-- performance.sql — Performance Analysis with EXPLAIN ANALYZE
-- Target: MySQL 8.0+
-- ============================================================================

USE university_management_system;

-- ============================================================================
-- QUERY 1: Find all enrolled students in a specific course with grades
-- Business Case: Registrar needs to pull the roster for Database Systems
-- ============================================================================

-- 1A) BEFORE INDEX — Drop custom indexes to test without them
DROP INDEX idx_enrollment_section  ON enrollment;
DROP INDEX idx_section_course      ON section;

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.name AS course_name,
    e.grade,
    e.status
FROM enrollment e
JOIN student s   ON e.student_id  = s.student_id
JOIN section sec ON e.section_id  = sec.section_id
JOIN course c    ON sec.course_id = c.course_id
WHERE c.course_code = 'CS301'
  AND e.status = 'Enrolled';

-- 1B) AFTER INDEX — Recreate indexes
CREATE INDEX idx_enrollment_section ON enrollment(section_id);
CREATE INDEX idx_section_course     ON section(course_id);

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    c.name AS course_name,
    e.grade,
    e.status
FROM enrollment e
JOIN student s   ON e.student_id  = s.student_id
JOIN section sec ON e.section_id  = sec.section_id
JOIN course c    ON sec.course_id = c.course_id
WHERE c.course_code = 'CS301'
  AND e.status = 'Enrolled';


-- ============================================================================
-- QUERY 2: Student fee defaulters report
-- Business Case: Finance office needs students with unpaid/overdue fees
-- ============================================================================

-- 2A) BEFORE INDEX
DROP INDEX idx_fee_status ON fee;

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.email,
    p.name AS program_name,
    f.semester,
    f.year,
    f.total_amount,
    f.paid_amount,
    (f.total_amount - f.paid_amount) AS outstanding_balance,
    f.due_date,
    f.status AS fee_status
FROM fee f
JOIN student s  ON f.student_id = s.student_id
JOIN program p  ON s.program_id = p.program_id
WHERE f.status IN ('Pending', 'Overdue', 'Partial')
ORDER BY f.status, outstanding_balance DESC;

-- 2B) AFTER INDEX
CREATE INDEX idx_fee_status ON fee(status);

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.email,
    p.name AS program_name,
    f.semester,
    f.year,
    f.total_amount,
    f.paid_amount,
    (f.total_amount - f.paid_amount) AS outstanding_balance,
    f.due_date,
    f.status AS fee_status
FROM fee f
JOIN student s  ON f.student_id = s.student_id
JOIN program p  ON s.program_id = p.program_id
WHERE f.status IN ('Pending', 'Overdue', 'Partial')
ORDER BY f.status, outstanding_balance DESC;


-- ============================================================================
-- QUERY 3: Attendance summary per student per course
-- Business Case: Instructor wants attendance percentage for grading decisions
-- ============================================================================

-- 3A) BEFORE INDEX
DROP INDEX idx_attendance_date ON attendance;

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    COUNT(*)                                             AS total_classes,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)  AS present_count,
    ROUND(
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    ) AS attendance_percentage
FROM attendance a
JOIN enrollment e  ON a.enrollment_id = e.enrollment_id
JOIN student s     ON e.student_id    = s.student_id
JOIN section sec   ON e.section_id    = sec.section_id
JOIN course c      ON sec.course_id   = c.course_id
WHERE sec.semester = 'Fall' AND sec.year = 2025
GROUP BY s.student_id, s.first_name, s.last_name, c.course_code
ORDER BY c.course_code, attendance_percentage ASC;

-- 3B) AFTER INDEX
CREATE INDEX idx_attendance_date ON attendance(attendance_date);
-- Also add composite index for better performance on this specific query
CREATE INDEX idx_section_sem_year ON section(semester, year);

EXPLAIN ANALYZE
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    c.course_code,
    COUNT(*)                                             AS total_classes,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END)  AS present_count,
    ROUND(
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    ) AS attendance_percentage
FROM attendance a
JOIN enrollment e  ON a.enrollment_id = e.enrollment_id
JOIN student s     ON e.student_id    = s.student_id
JOIN section sec   ON e.section_id    = sec.section_id
JOIN course c      ON sec.course_id   = c.course_id
WHERE sec.semester = 'Fall' AND sec.year = 2025
GROUP BY s.student_id, s.first_name, s.last_name, c.course_code
ORDER BY c.course_code, attendance_percentage ASC;


-- ============================================================================
-- QUERY 4: Hostel occupancy report
-- Business Case: Warden needs current occupancy overview
-- ============================================================================

-- 4A) BEFORE INDEX
DROP INDEX idx_hostel_alloc_status ON hostel_allocation;

EXPLAIN ANALYZE
SELECT
    h.name AS hostel_name,
    h.hostel_type,
    hr.room_number,
    hr.room_type,
    hr.capacity,
    hr.current_occupancy,
    CONCAT(s.first_name, ' ', s.last_name) AS occupant_name,
    ha.alloc_date
FROM hostel h
JOIN hostel_room hr       ON h.hostel_id      = hr.hostel_id
LEFT JOIN hostel_allocation ha ON hr.room_id   = ha.room_id AND ha.status = 'Active'
LEFT JOIN student s       ON ha.student_id     = s.student_id
ORDER BY h.name, hr.room_number;

-- 4B) AFTER INDEX
CREATE INDEX idx_hostel_alloc_status ON hostel_allocation(status);
CREATE INDEX idx_hostel_alloc_room   ON hostel_allocation(room_id);

EXPLAIN ANALYZE
SELECT
    h.name AS hostel_name,
    h.hostel_type,
    hr.room_number,
    hr.room_type,
    hr.capacity,
    hr.current_occupancy,
    CONCAT(s.first_name, ' ', s.last_name) AS occupant_name,
    ha.alloc_date
FROM hostel h
JOIN hostel_room hr       ON h.hostel_id      = hr.hostel_id
LEFT JOIN hostel_allocation ha ON hr.room_id   = ha.room_id AND ha.status = 'Active'
LEFT JOIN student s       ON ha.student_id     = s.student_id
ORDER BY h.name, hr.room_number;


-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- After running each pair, compare the "actual time" values in the EXPLAIN
-- ANALYZE output. Key observations:
--
-- Query 1: Index on enrollment(section_id) and section(course_id) turns
--          full table scans into index lookups, significantly reducing
--          rows examined for JOIN operations.
--
-- Query 2: Index on fee(status) enables MySQL to filter directly via
--          index range scan on the IN ('Pending','Overdue','Partial')
--          predicate instead of scanning every fee record.
--
-- Query 3: Composite index on section(semester, year) allows the optimizer
--          to narrow down sections before joining, reducing the overall
--          join cardinality. The attendance_date index helps date-based
--          queries in other contexts.
--
-- Query 4: Index on hostel_allocation(status, room_id) helps the LEFT JOIN
--          filter only active allocations efficiently.
--
-- With 275 seed records the improvements are modest, but on production-scale
-- data (10K–1M+ rows) these indexes would yield orders-of-magnitude speedups.
-- ============================================================================
