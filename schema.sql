-- ============================================================================
-- UNIVERSITY MANAGEMENT SYSTEM (UMS)
-- schema.sql — Complete Database Schema (3NF)
-- Target: MySQL 8.0+
-- ============================================================================

DROP DATABASE IF EXISTS university_management_system;
CREATE DATABASE university_management_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE university_management_system;

-- ============================================================================
-- 1. DEPARTMENT
-- ============================================================================
CREATE TABLE department (
    department_id   INT             AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    description     VARCHAR(500),
    office_location VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_department        PRIMARY KEY (department_id),
    CONSTRAINT uq_department_name   UNIQUE (name),
    CONSTRAINT uq_department_email  UNIQUE (email)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. PROGRAM  (degree programs offered by departments)
-- ============================================================================
CREATE TABLE program (
    program_id      INT             AUTO_INCREMENT,
    name            VARCHAR(150)    NOT NULL,
    department_id   INT             NOT NULL,
    degree_type     ENUM('BS','MS','PhD','Associate','Diploma')  NOT NULL,
    duration_years  TINYINT UNSIGNED NOT NULL,
    total_credits   SMALLINT UNSIGNED NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_program               PRIMARY KEY (program_id),
    CONSTRAINT uq_program_name_degree   UNIQUE (name, degree_type),
    CONSTRAINT fk_program_department    FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_program_duration     CHECK (duration_years BETWEEN 1 AND 8),
    CONSTRAINT chk_program_credits      CHECK (total_credits > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. INSTRUCTOR
-- ============================================================================
CREATE TABLE instructor (
    instructor_id   INT             AUTO_INCREMENT,
    first_name      VARCHAR(50)     NOT NULL,
    last_name       VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20),
    department_id   INT             NOT NULL,
    hire_date       DATE            NOT NULL,
    designation     ENUM('Lecturer','Assistant Professor','Associate Professor','Professor','Visiting Faculty') NOT NULL,
    salary          DECIMAL(12,2)   NOT NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_instructor            PRIMARY KEY (instructor_id),
    CONSTRAINT uq_instructor_email      UNIQUE (email),
    CONSTRAINT fk_instructor_department FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_instructor_salary    CHECK (salary >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. STUDENT
-- ============================================================================
CREATE TABLE student (
    student_id      INT             AUTO_INCREMENT,
    first_name      VARCHAR(50)     NOT NULL,
    last_name       VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20),
    dob             DATE            NOT NULL,
    gender          ENUM('Male','Female','Other') NOT NULL,
    address         VARCHAR(300),
    city            VARCHAR(100),
    program_id      INT             NOT NULL,
    enrollment_date DATE            NOT NULL,
    current_semester TINYINT UNSIGNED NOT NULL DEFAULT 1,
    cgpa            DECIMAL(3,2)    NOT NULL DEFAULT 0.00,
    status          ENUM('Active','Graduated','Suspended','Withdrawn','On Leave') NOT NULL DEFAULT 'Active',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_student           PRIMARY KEY (student_id),
    CONSTRAINT uq_student_email     UNIQUE (email),
    CONSTRAINT fk_student_program   FOREIGN KEY (program_id)
        REFERENCES program(program_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_student_cgpa     CHECK (cgpa BETWEEN 0.00 AND 4.00),
    CONSTRAINT chk_student_semester CHECK (current_semester BETWEEN 1 AND 16)
) ENGINE=InnoDB;

-- ============================================================================
-- 5. COURSE
-- ============================================================================
CREATE TABLE course (
    course_id       INT             AUTO_INCREMENT,
    course_code     VARCHAR(15)     NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    description     VARCHAR(500),
    credits         TINYINT UNSIGNED NOT NULL,
    department_id   INT             NOT NULL,
    is_elective     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_course                PRIMARY KEY (course_id),
    CONSTRAINT uq_course_code           UNIQUE (course_code),
    CONSTRAINT fk_course_department     FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_course_credits       CHECK (credits BETWEEN 1 AND 6)
) ENGINE=InnoDB;

-- ============================================================================
-- 6. COURSE_PREREQUISITE  (self-referencing M:N on course)
-- ============================================================================
CREATE TABLE course_prerequisite (
    course_id       INT NOT NULL,
    prerequisite_id INT NOT NULL,
    CONSTRAINT pk_course_prerequisite   PRIMARY KEY (course_id, prerequisite_id),
    CONSTRAINT fk_cp_course             FOREIGN KEY (course_id)
        REFERENCES course(course_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_cp_prerequisite       FOREIGN KEY (prerequisite_id)
        REFERENCES course(course_id)
        ON UPDATE CASCADE ON DELETE CASCADE
    -- NOTE: Self-referencing check (course_id <> prerequisite_id) is enforced
    -- via trigger below, because MySQL 8.0 does not allow CHECK constraints
    -- on columns used in FK referential actions (Error 3823).
) ENGINE=InnoDB;

-- ============================================================================
-- 7. SECTION  (a course offering in a specific semester)
-- ============================================================================
CREATE TABLE section (
    section_id      INT             AUTO_INCREMENT,
    course_id       INT             NOT NULL,
    instructor_id   INT             NOT NULL,
    semester        ENUM('Fall','Spring','Summer') NOT NULL,
    year            YEAR            NOT NULL,
    schedule_days   VARCHAR(20)     NOT NULL COMMENT 'e.g. Mon/Wed, Tue/Thu',
    schedule_time   TIME            NOT NULL,
    room            VARCHAR(30),
    capacity        SMALLINT UNSIGNED NOT NULL DEFAULT 40,
    enrolled_count  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT pk_section               PRIMARY KEY (section_id),
    CONSTRAINT fk_section_course        FOREIGN KEY (course_id)
        REFERENCES course(course_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_section_instructor    FOREIGN KEY (instructor_id)
        REFERENCES instructor(instructor_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_section_capacity     CHECK (capacity > 0),
    CONSTRAINT chk_section_enrolled     CHECK (enrolled_count >= 0 AND enrolled_count <= capacity)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. ENROLLMENT  (student ↔ section, includes final grade)
-- ============================================================================
CREATE TABLE enrollment (
    enrollment_id   INT             AUTO_INCREMENT,
    student_id      INT             NOT NULL,
    section_id      INT             NOT NULL,
    enrollment_date DATE            NOT NULL,
    grade           VARCHAR(2)      DEFAULT NULL COMMENT 'A+,A,A-,B+,...,F,W,I',
    grade_points    DECIMAL(3,2)    DEFAULT NULL,
    status          ENUM('Enrolled','Completed','Dropped','Withdrawn') NOT NULL DEFAULT 'Enrolled',
    CONSTRAINT pk_enrollment            PRIMARY KEY (enrollment_id),
    CONSTRAINT uq_enrollment_student_section UNIQUE (student_id, section_id),
    CONSTRAINT fk_enrollment_student    FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_enrollment_section    FOREIGN KEY (section_id)
        REFERENCES section(section_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_enrollment_gp        CHECK (grade_points IS NULL OR grade_points BETWEEN 0.00 AND 4.00)
) ENGINE=InnoDB;

-- ============================================================================
-- 9. ATTENDANCE
-- ============================================================================
CREATE TABLE attendance (
    attendance_id   INT             AUTO_INCREMENT,
    enrollment_id   INT             NOT NULL,
    attendance_date DATE            NOT NULL,
    status          ENUM('Present','Absent','Late','Excused') NOT NULL,
    CONSTRAINT pk_attendance            PRIMARY KEY (attendance_id),
    CONSTRAINT uq_attendance_record     UNIQUE (enrollment_id, attendance_date),
    CONSTRAINT fk_attendance_enrollment FOREIGN KEY (enrollment_id)
        REFERENCES enrollment(enrollment_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- 10. ASSIGNMENT
-- ============================================================================
CREATE TABLE assignment (
    assignment_id   INT             AUTO_INCREMENT,
    section_id      INT             NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT,
    max_marks       DECIMAL(6,2)    NOT NULL,
    weightage       DECIMAL(5,2)    NOT NULL COMMENT 'percentage of total grade',
    due_date        DATETIME        NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_assignment            PRIMARY KEY (assignment_id),
    CONSTRAINT fk_assignment_section    FOREIGN KEY (section_id)
        REFERENCES section(section_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_assignment_marks     CHECK (max_marks > 0),
    CONSTRAINT chk_assignment_weight    CHECK (weightage BETWEEN 0.00 AND 100.00)
) ENGINE=InnoDB;

-- ============================================================================
-- 11. SUBMISSION  (student submits assignment)
-- ============================================================================
CREATE TABLE submission (
    submission_id   INT             AUTO_INCREMENT,
    assignment_id   INT             NOT NULL,
    student_id      INT             NOT NULL,
    submission_date DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    marks_obtained  DECIMAL(6,2)    DEFAULT NULL,
    feedback        TEXT,
    is_late         BOOLEAN         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_submission                PRIMARY KEY (submission_id),
    CONSTRAINT uq_submission_student_assign UNIQUE (student_id, assignment_id),
    CONSTRAINT fk_submission_assignment     FOREIGN KEY (assignment_id)
        REFERENCES assignment(assignment_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_submission_student        FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_submission_marks         CHECK (marks_obtained IS NULL OR marks_obtained >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 12. FEE  (semester-wise student billing)
-- ============================================================================
CREATE TABLE fee (
    fee_id          INT             AUTO_INCREMENT,
    student_id      INT             NOT NULL,
    semester        ENUM('Fall','Spring','Summer') NOT NULL,
    year            YEAR            NOT NULL,
    total_amount    DECIMAL(12,2)   NOT NULL,
    paid_amount     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    due_date        DATE            NOT NULL,
    payment_date    DATE            DEFAULT NULL,
    status          ENUM('Pending','Partial','Paid','Overdue') NOT NULL DEFAULT 'Pending',
    CONSTRAINT pk_fee               PRIMARY KEY (fee_id),
    CONSTRAINT uq_fee_student_sem   UNIQUE (student_id, semester, year),
    CONSTRAINT fk_fee_student       FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_fee_amounts      CHECK (total_amount > 0 AND paid_amount >= 0 AND paid_amount <= total_amount)
) ENGINE=InnoDB;

-- ============================================================================
-- 13. BOOK  (library catalogue)
-- ============================================================================
CREATE TABLE book (
    book_id         INT             AUTO_INCREMENT,
    title           VARCHAR(250)    NOT NULL,
    author          VARCHAR(200)    NOT NULL,
    isbn            VARCHAR(20)     NOT NULL,
    publisher       VARCHAR(150),
    publish_year    YEAR,
    category        VARCHAR(80),
    total_copies    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    available_copies SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    CONSTRAINT pk_book              PRIMARY KEY (book_id),
    CONSTRAINT uq_book_isbn         UNIQUE (isbn),
    CONSTRAINT chk_book_copies      CHECK (available_copies >= 0 AND available_copies <= total_copies)
) ENGINE=InnoDB;

-- ============================================================================
-- 14. BOOK_ISSUE  (lending transactions)
-- ============================================================================
CREATE TABLE book_issue (
    issue_id        INT             AUTO_INCREMENT,
    book_id         INT             NOT NULL,
    student_id      INT             NOT NULL,
    issue_date      DATE            NOT NULL,
    due_date        DATE            NOT NULL,
    return_date     DATE            DEFAULT NULL,
    fine            DECIMAL(8,2)    NOT NULL DEFAULT 0.00,
    CONSTRAINT pk_book_issue            PRIMARY KEY (issue_id),
    CONSTRAINT fk_book_issue_book       FOREIGN KEY (book_id)
        REFERENCES book(book_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_book_issue_student    FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_book_issue_dates     CHECK (due_date >= issue_date),
    CONSTRAINT chk_book_issue_fine      CHECK (fine >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 15. HOSTEL
-- ============================================================================
CREATE TABLE hostel (
    hostel_id       INT             AUTO_INCREMENT,
    name            VARCHAR(100)    NOT NULL,
    hostel_type     ENUM('Male','Female','Co-Ed') NOT NULL,
    total_rooms     SMALLINT UNSIGNED NOT NULL,
    warden_name     VARCHAR(100),
    contact_phone   VARCHAR(20),
    CONSTRAINT pk_hostel            PRIMARY KEY (hostel_id),
    CONSTRAINT uq_hostel_name       UNIQUE (name),
    CONSTRAINT chk_hostel_rooms     CHECK (total_rooms > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 16. HOSTEL_ROOM
-- ============================================================================
CREATE TABLE hostel_room (
    room_id         INT             AUTO_INCREMENT,
    hostel_id       INT             NOT NULL,
    room_number     VARCHAR(10)     NOT NULL,
    capacity        TINYINT UNSIGNED NOT NULL DEFAULT 2,
    current_occupancy TINYINT UNSIGNED NOT NULL DEFAULT 0,
    room_type       ENUM('Single','Double','Triple') NOT NULL DEFAULT 'Double',
    CONSTRAINT pk_hostel_room           PRIMARY KEY (room_id),
    CONSTRAINT uq_hostel_room_number    UNIQUE (hostel_id, room_number),
    CONSTRAINT fk_hostel_room_hostel    FOREIGN KEY (hostel_id)
        REFERENCES hostel(hostel_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_room_occupancy       CHECK (current_occupancy >= 0 AND current_occupancy <= capacity)
) ENGINE=InnoDB;

-- ============================================================================
-- 17. HOSTEL_ALLOCATION  (student ↔ room assignment)
-- ============================================================================
CREATE TABLE hostel_allocation (
    allocation_id   INT             AUTO_INCREMENT,
    student_id      INT             NOT NULL,
    room_id         INT             NOT NULL,
    alloc_date      DATE            NOT NULL,
    vacate_date     DATE            DEFAULT NULL,
    status          ENUM('Active','Vacated','Transferred') NOT NULL DEFAULT 'Active',
    CONSTRAINT pk_hostel_allocation          PRIMARY KEY (allocation_id),
    CONSTRAINT fk_hostel_alloc_student       FOREIGN KEY (student_id)
        REFERENCES student(student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hostel_alloc_room          FOREIGN KEY (room_id)
        REFERENCES hostel_room(room_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_hostel_alloc_dates        CHECK (vacate_date IS NULL OR vacate_date >= alloc_date)
) ENGINE=InnoDB;

-- ============================================================================
-- 18. USERS  (authentication & authorization for the backend API)
-- ============================================================================
CREATE TABLE users (
    user_id         INT             AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            ENUM('Admin','Instructor','Student','Librarian') NOT NULL,
    linked_id       INT             DEFAULT NULL COMMENT 'FK to student_id or instructor_id (set after registration)',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login      DATETIME        DEFAULT NULL,
    CONSTRAINT pk_users             PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email       UNIQUE (email),
    INDEX idx_users_email (email),
    INDEX idx_users_role  (role)
) ENGINE=InnoDB;

-- ============================================================================
-- INDEXES  (beyond the automatic PK/UNIQUE/FK indexes)
-- ============================================================================

-- Frequently filtered/joined columns
CREATE INDEX idx_student_program        ON student(program_id);
CREATE INDEX idx_student_status         ON student(status);
CREATE INDEX idx_student_cgpa           ON student(cgpa);

CREATE INDEX idx_instructor_department  ON instructor(department_id);

CREATE INDEX idx_course_department      ON course(department_id);

CREATE INDEX idx_section_course         ON section(course_id);
CREATE INDEX idx_section_instructor     ON section(instructor_id);
CREATE INDEX idx_section_semester_year  ON section(semester, year);

CREATE INDEX idx_enrollment_student     ON enrollment(student_id);
CREATE INDEX idx_enrollment_section     ON enrollment(section_id);
CREATE INDEX idx_enrollment_status      ON enrollment(status);

CREATE INDEX idx_attendance_date        ON attendance(attendance_date);

CREATE INDEX idx_fee_student            ON fee(student_id);
CREATE INDEX idx_fee_status             ON fee(status);

CREATE INDEX idx_book_issue_student     ON book_issue(student_id);
CREATE INDEX idx_book_issue_book        ON book_issue(book_id);

CREATE INDEX idx_hostel_alloc_student   ON hostel_allocation(student_id);
CREATE INDEX idx_hostel_alloc_status    ON hostel_allocation(status);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- VIEW 1: Student academic overview (transcript-like)
CREATE OR REPLACE VIEW vw_student_transcript AS
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name)  AS student_name,
    p.name                                    AS program_name,
    c.course_code,
    c.name                                    AS course_name,
    c.credits,
    sec.semester,
    sec.year,
    e.grade,
    e.grade_points,
    e.status                                  AS enrollment_status
FROM student s
JOIN enrollment e    ON s.student_id   = e.student_id
JOIN section sec     ON e.section_id   = sec.section_id
JOIN course c        ON sec.course_id  = c.course_id
JOIN program p       ON s.program_id   = p.program_id;

-- VIEW 2: Section roster with instructor info
CREATE OR REPLACE VIEW vw_section_roster AS
SELECT
    sec.section_id,
    c.course_code,
    c.name                                      AS course_name,
    sec.semester,
    sec.year,
    CONCAT(i.first_name, ' ', i.last_name)      AS instructor_name,
    sec.schedule_days,
    sec.schedule_time,
    sec.room,
    sec.capacity,
    sec.enrolled_count
FROM section sec
JOIN course c       ON sec.course_id     = c.course_id
JOIN instructor i   ON sec.instructor_id = i.instructor_id;

-- VIEW 3: Fee summary per student
CREATE OR REPLACE VIEW vw_student_fee_summary AS
SELECT
    s.student_id,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    f.semester,
    f.year,
    f.total_amount,
    f.paid_amount,
    (f.total_amount - f.paid_amount)        AS balance_due,
    f.status                                AS payment_status,
    f.due_date
FROM student s
JOIN fee f ON s.student_id = f.student_id;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

-- TRIGGER 0: Prevent a course from being its own prerequisite (replaces CHECK
--            constraint that MySQL 8.0 disallows on FK columns — Error 3823)
CREATE TRIGGER trg_before_prereq_insert
BEFORE INSERT ON course_prerequisite
FOR EACH ROW
BEGIN
    IF NEW.course_id = NEW.prerequisite_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'A course cannot be its own prerequisite.';
    END IF;
END//

-- TRIGGER 1: After enrollment INSERT → increment section enrolled_count
CREATE TRIGGER trg_after_enrollment_insert
AFTER INSERT ON enrollment
FOR EACH ROW
BEGIN
    IF NEW.status = 'Enrolled' THEN
        UPDATE section
        SET enrolled_count = enrolled_count + 1
        WHERE section_id = NEW.section_id;
    END IF;
END//

-- TRIGGER 2: After enrollment UPDATE (drop/withdraw) → decrement section enrolled_count
CREATE TRIGGER trg_after_enrollment_update
AFTER UPDATE ON enrollment
FOR EACH ROW
BEGIN
    -- Student was enrolled but is now dropped/withdrawn
    IF OLD.status = 'Enrolled' AND NEW.status IN ('Dropped','Withdrawn') THEN
        UPDATE section
        SET enrolled_count = enrolled_count - 1
        WHERE section_id = NEW.section_id;
    END IF;
    -- Student was dropped/withdrawn but is now re-enrolled
    IF OLD.status IN ('Dropped','Withdrawn') AND NEW.status = 'Enrolled' THEN
        UPDATE section
        SET enrolled_count = enrolled_count + 1
        WHERE section_id = NEW.section_id;
    END IF;
END//

-- TRIGGER 3: Before book_issue INSERT → decrement available copies & validate
CREATE TRIGGER trg_before_book_issue_insert
BEFORE INSERT ON book_issue
FOR EACH ROW
BEGIN
    DECLARE avail INT;
    SELECT available_copies INTO avail FROM book WHERE book_id = NEW.book_id;
    IF avail <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'No copies available for this book.';
    END IF;
    UPDATE book
    SET available_copies = available_copies - 1
    WHERE book_id = NEW.book_id;
END//

-- TRIGGER 4: After book_issue UPDATE (return) → increment available copies & compute fine
CREATE TRIGGER trg_after_book_return
BEFORE UPDATE ON book_issue
FOR EACH ROW
BEGIN
    IF OLD.return_date IS NULL AND NEW.return_date IS NOT NULL THEN
        UPDATE book
        SET available_copies = available_copies + 1
        WHERE book_id = NEW.book_id;
        -- Auto-calculate fine: 10 per day overdue
        IF NEW.return_date > NEW.due_date THEN
            SET NEW.fine = DATEDIFF(NEW.return_date, NEW.due_date) * 10.00;
        ELSE
            SET NEW.fine = 0.00;
        END IF;
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- 1NF DEMO TABLE  (unnormalized — for ER comparison)
-- This table is intentionally NOT normalized. It demonstrates the 1NF state
-- before normalization to 3NF.  Do NOT use in production.
-- ============================================================================

CREATE TABLE IF NOT EXISTS _demo_1nf_university_record (
    record_id           INT AUTO_INCREMENT PRIMARY KEY,
    -- Student info (repeats per course)
    student_id          INT,
    student_first_name  VARCHAR(50),
    student_last_name   VARCHAR(50),
    student_email       VARCHAR(100),
    student_phone       VARCHAR(20),
    student_dob         DATE,
    student_gender      VARCHAR(10),
    student_address     VARCHAR(300),
    student_cgpa        DECIMAL(3,2),
    -- Program info (repeats)
    program_name        VARCHAR(150),
    degree_type         VARCHAR(20),
    -- Department info (repeats)
    department_name     VARCHAR(100),
    department_phone    VARCHAR(20),
    -- Course info
    course_code         VARCHAR(15),
    course_name         VARCHAR(150),
    course_credits      TINYINT,
    -- Section / instructor info
    instructor_name     VARCHAR(100),
    instructor_email    VARCHAR(100),
    semester            VARCHAR(10),
    section_year        YEAR,
    schedule_days       VARCHAR(20),
    schedule_time       TIME,
    room                VARCHAR(30),
    -- Grade
    grade               VARCHAR(2),
    grade_points        DECIMAL(3,2),
    -- Fee info (repeats per semester)
    fee_total           DECIMAL(12,2),
    fee_paid            DECIMAL(12,2),
    fee_status          VARCHAR(20),
    -- Hostel info (repeats)
    hostel_name         VARCHAR(100),
    hostel_room_number  VARCHAR(10),
    -- Library info (repeats per book issued)
    book_title          VARCHAR(250),
    book_isbn           VARCHAR(20),
    issue_date          DATE,
    return_date         DATE
) ENGINE=InnoDB COMMENT='1NF demo — unnormalized flat table for ER comparison';
