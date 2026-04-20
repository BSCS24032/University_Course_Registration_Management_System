-- ============================================================================
-- UNIVERSITY MANAGEMENT SYSTEM (UMS) — MIGRATION v2
-- Adds: semester, announcement, feedback, notification, exam, waitlist tables
-- Plus: academic probation view, waitlist promotion trigger
--
-- RUN AFTER schema.sql and seed.sql are loaded.
--   mysql -u root -p < migration_v2.sql
-- ============================================================================

USE university_management_system;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop (for re-runs) in reverse dependency order
DROP TRIGGER IF EXISTS trg_after_enrollment_drop_promote;
DROP VIEW IF EXISTS vw_academic_probation;
DROP VIEW IF EXISTS vw_weekly_timetable;
DROP TABLE IF EXISTS waitlist;
DROP TABLE IF EXISTS exam;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS announcement;
DROP TABLE IF EXISTS semester;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 20. SEMESTER  (academic calendar — controls registration windows)
-- ============================================================================
CREATE TABLE semester (
    semester_id         INT             AUTO_INCREMENT,
    term                ENUM('Fall','Spring','Summer') NOT NULL,
    year                YEAR            NOT NULL,
    start_date          DATE            NOT NULL,
    end_date            DATE            NOT NULL,
    registration_open   DATE            NOT NULL,
    registration_close  DATE            NOT NULL,
    add_drop_deadline   DATE            NOT NULL,
    status              ENUM('Upcoming','Active','Completed') NOT NULL DEFAULT 'Upcoming',
    CONSTRAINT pk_semester              PRIMARY KEY (semester_id),
    CONSTRAINT uq_semester_term_year    UNIQUE (term, year),
    CONSTRAINT chk_semester_dates       CHECK (end_date > start_date
                                          AND registration_close >= registration_open
                                          AND add_drop_deadline >= start_date)
) ENGINE=InnoDB;

-- ============================================================================
-- 21. ANNOUNCEMENT  (notice board — targeted by audience)
-- ============================================================================
CREATE TABLE announcement (
    announcement_id     INT             AUTO_INCREMENT,
    title               VARCHAR(200)    NOT NULL,
    body                TEXT            NOT NULL,
    audience            ENUM('All','Students','Instructors','Program','Section','Department') NOT NULL,
    target_id           INT             DEFAULT NULL COMMENT 'program_id / section_id / department_id when audience is narrow',
    posted_by_user_id   INT             NOT NULL,
    posted_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at          DATETIME        DEFAULT NULL,
    is_pinned           BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_announcement          PRIMARY KEY (announcement_id),
    CONSTRAINT fk_announcement_user     FOREIGN KEY (posted_by_user_id)
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_announcement_audience ON announcement(audience, target_id);
CREATE INDEX idx_announcement_posted   ON announcement(posted_at DESC);

-- ============================================================================
-- 22. FEEDBACK  (anonymous course evaluation — students rate instructors)
-- ============================================================================
CREATE TABLE feedback (
    feedback_id         INT             AUTO_INCREMENT,
    enrollment_id       INT             NOT NULL,
    instructor_id       INT             NOT NULL,
    section_id          INT             NOT NULL,
    rating_teaching     TINYINT UNSIGNED NOT NULL COMMENT '1-5',
    rating_content      TINYINT UNSIGNED NOT NULL COMMENT '1-5',
    rating_fairness     TINYINT UNSIGNED NOT NULL COMMENT '1-5',
    comments            TEXT            DEFAULT NULL,
    submitted_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_feedback              PRIMARY KEY (feedback_id),
    CONSTRAINT uq_feedback_enrollment   UNIQUE (enrollment_id),
    CONSTRAINT fk_feedback_enrollment   FOREIGN KEY (enrollment_id)
        REFERENCES enrollment(enrollment_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_feedback_instructor   FOREIGN KEY (instructor_id)
        REFERENCES instructor(instructor_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_feedback_section      FOREIGN KEY (section_id)
        REFERENCES section(section_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_rating_teaching      CHECK (rating_teaching BETWEEN 1 AND 5),
    CONSTRAINT chk_rating_content       CHECK (rating_content  BETWEEN 1 AND 5),
    CONSTRAINT chk_rating_fairness      CHECK (rating_fairness BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE INDEX idx_feedback_instructor ON feedback(instructor_id);
CREATE INDEX idx_feedback_section    ON feedback(section_id);

-- ============================================================================
-- 23. NOTIFICATION  (per-user in-app notifications — polled from the frontend)
-- ============================================================================
CREATE TABLE notification (
    notification_id     INT             AUTO_INCREMENT,
    user_id             INT             NOT NULL,
    type                ENUM('Grade','Fee','Announcement','Assignment','Waitlist','General') NOT NULL,
    title               VARCHAR(200)    NOT NULL,
    body                VARCHAR(500)    NOT NULL,
    link                VARCHAR(255)    DEFAULT NULL,
    is_read             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_notification          PRIMARY KEY (notification_id),
    CONSTRAINT fk_notification_user     FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_notification_user_read ON notification(user_id, is_read, created_at DESC);

-- ============================================================================
-- 24. EXAM  (scheduled quizzes, midterms, finals)
-- ============================================================================
CREATE TABLE exam (
    exam_id             INT             AUTO_INCREMENT,
    section_id          INT             NOT NULL,
    exam_type           ENUM('Quiz','Midterm','Final') NOT NULL,
    title               VARCHAR(150)    NOT NULL,
    exam_date           DATE            NOT NULL,
    start_time          TIME            NOT NULL,
    duration_minutes    SMALLINT UNSIGNED NOT NULL,
    room                VARCHAR(30)     NOT NULL,
    total_marks         SMALLINT UNSIGNED NOT NULL,
    weightage           DECIMAL(5,2)    NOT NULL COMMENT 'Percent contribution to final grade',
    CONSTRAINT pk_exam                  PRIMARY KEY (exam_id),
    CONSTRAINT fk_exam_section          FOREIGN KEY (section_id)
        REFERENCES section(section_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_exam_duration        CHECK (duration_minutes BETWEEN 15 AND 300),
    CONSTRAINT chk_exam_weight          CHECK (weightage BETWEEN 0 AND 100),
    CONSTRAINT chk_exam_marks           CHECK (total_marks > 0)
) ENGINE=InnoDB;

CREATE INDEX idx_exam_section ON exam(section_id);
CREATE INDEX idx_exam_date    ON exam(exam_date);

-- ============================================================================
-- 25. WAITLIST  (when a section is at capacity)
-- ============================================================================
CREATE TABLE waitlist (
    waitlist_id         INT             AUTO_INCREMENT,
    student_id          INT             NOT NULL,
    section_id          INT             NOT NULL,
    position            INT             NOT NULL,
    joined_at           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status              ENUM('Waiting','Promoted','Cancelled') NOT NULL DEFAULT 'Waiting',
    CONSTRAINT pk_waitlist              PRIMARY KEY (waitlist_id),
    CONSTRAINT uq_waitlist_student_sec  UNIQUE (student_id, section_id),
    CONSTRAINT fk_waitlist_student      FOREIGN KEY (student_id)
        REFERENCES student(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_waitlist_section      FOREIGN KEY (section_id)
        REFERENCES section(section_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_waitlist_section_status ON waitlist(section_id, status, position);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Academic probation — students with CGPA below 2.0
CREATE OR REPLACE VIEW vw_academic_probation AS
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    s.email,
    p.name AS program_name,
    s.cgpa,
    CASE
        WHEN s.cgpa < 1.50 THEN 'Critical'
        WHEN s.cgpa < 2.00 THEN 'Probation'
        ELSE 'Good Standing'
    END AS standing
FROM student s
JOIN program p ON s.program_id = p.program_id
WHERE s.status = 'Active' AND s.cgpa < 2.00;

-- Weekly timetable flattened from section schedules (each row = one class meeting)
CREATE OR REPLACE VIEW vw_weekly_timetable AS
SELECT
    sec.section_id,
    sec.course_id,
    c.course_code,
    c.name AS course_name,
    sec.instructor_id,
    CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
    sec.schedule_days,
    sec.schedule_time,
    sec.room,
    sec.semester,
    sec.year
FROM section sec
JOIN course c ON sec.course_id = c.course_id
JOIN instructor i ON sec.instructor_id = i.instructor_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- When an Enrolled row becomes Dropped/Withdrawn, promote the top of the waitlist.
-- The existing trg_after_enrollment_update already handles enrolled_count, so this
-- only creates the new Enrolled row for the promoted student.
CREATE TRIGGER trg_after_enrollment_drop_promote
AFTER UPDATE ON enrollment
FOR EACH ROW
BEGIN
    DECLARE v_waitlist_id INT;
    DECLARE v_student_id INT;

    IF OLD.status = 'Enrolled' AND NEW.status IN ('Dropped','Withdrawn') THEN
        -- Find the top of the waitlist for this section
        SELECT waitlist_id, student_id INTO v_waitlist_id, v_student_id
        FROM waitlist
        WHERE section_id = NEW.section_id AND status = 'Waiting'
        ORDER BY position ASC
        LIMIT 1;

        IF v_waitlist_id IS NOT NULL THEN
            -- Mark the waitlist entry as Promoted
            UPDATE waitlist SET status = 'Promoted' WHERE waitlist_id = v_waitlist_id;

            -- Create the Enrolled row (trg_after_enrollment_insert will bump count)
            INSERT INTO enrollment (student_id, section_id, enrollment_date, status)
            VALUES (v_student_id, NEW.section_id, CURDATE(), 'Enrolled');

            -- Notify the student
            INSERT INTO notification (user_id, type, title, body, link)
            SELECT u.user_id, 'Waitlist',
                   'You have been promoted from the waitlist',
                   CONCAT('A seat opened up in section ', NEW.section_id, '. You are now Enrolled.'),
                   '/enrollment'
            FROM users u
            WHERE u.role = 'Student' AND u.linked_id = v_student_id;
        END IF;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Three semesters: one completed, one active (current registration window), one upcoming
INSERT INTO semester (term, year, start_date, end_date, registration_open, registration_close, add_drop_deadline, status) VALUES
('Fall',   2025, '2025-09-01', '2025-12-20', '2025-08-01', '2025-09-07', '2025-09-14', 'Completed'),
('Spring', 2026, '2026-02-01', '2026-05-30', '2026-01-10', '2026-05-01', '2026-02-15', 'Active'),
('Fall',   2026, '2026-09-01', '2026-12-20', '2026-08-01', '2026-09-07', '2026-09-14', 'Upcoming');

-- Announcements posted by admin (user_id 1 is assumed to be admin@ums.edu.pk per seed)
INSERT INTO announcement (title, body, audience, target_id, posted_by_user_id, expires_at, is_pinned) VALUES
('Welcome to Spring 2026', 'Classes begin Monday, 2 February. Please ensure your enrollment and fees are cleared before the first day.', 'All', NULL, 1, '2026-03-01 23:59:59', TRUE),
('Library late-fee policy update', 'Effective immediately, books returned more than 14 days late will incur double the standard fine. Please return on time to avoid charges.', 'Students', NULL, 1, NULL, FALSE),
('Mid-semester exam schedule posted', 'The midterm exam timetable has been published. Check your timetable page for the dates, times, and rooms for each of your sections.', 'Students', NULL, 1, '2026-04-15 23:59:59', FALSE),
('Instructor meeting Thursday', 'All teaching faculty are reminded of the monthly academic committee meeting this Thursday at 3pm in the Senate Hall.', 'Instructors', NULL, 1, '2026-04-25 23:59:59', FALSE);

-- A few sample exams for the Active semester's sections
-- (section_ids 1..8 are assumed to exist per the main seed)
INSERT INTO exam (section_id, exam_type, title, exam_date, start_time, duration_minutes, room, total_marks, weightage) VALUES
(1, 'Midterm', 'CS101 Midterm',        '2026-03-25', '10:00:00', 90,  'Exam Hall A', 50,  25.00),
(1, 'Final',   'CS101 Final',          '2026-05-20', '09:00:00', 180, 'Exam Hall A', 100, 50.00),
(2, 'Quiz',    'CS201 Quiz 2',         '2026-03-10', '14:00:00', 30,  'Room 201',    20,  10.00),
(2, 'Midterm', 'CS201 Midterm',        '2026-04-02', '10:00:00', 90,  'Exam Hall B', 50,  30.00),
(3, 'Midterm', 'EE101 Midterm',        '2026-03-28', '11:00:00', 90,  'Exam Hall A', 50,  25.00),
(4, 'Final',   'BA101 Final',          '2026-05-22', '14:00:00', 180, 'Exam Hall C', 100, 50.00);

-- Welcome notifications for every user
INSERT INTO notification (user_id, type, title, body, link)
SELECT user_id, 'General',
       'Welcome to the new UMS portal',
       'We have added announcements, timetables, exam schedules, and course feedback. Explore the sidebar.',
       '/dashboard'
FROM users;

-- Fee-due notifications for students with outstanding balances
INSERT INTO notification (user_id, type, title, body, link)
SELECT u.user_id, 'Fee',
       'Fee voucher outstanding',
       CONCAT('You have an unpaid balance of PKR ', FORMAT(f.total_amount - f.paid_amount, 0), ' for ', f.semester, ' ', f.year, '.'),
       '/fees'
FROM users u
JOIN fee f ON f.student_id = u.linked_id
WHERE u.role = 'Student' AND f.status IN ('Unpaid','Partial');

-- ============================================================================
-- END OF MIGRATION v2
-- ============================================================================
