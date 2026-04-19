-- ============================================================================
-- UNIVERSITY MANAGEMENT SYSTEM (UMS)
-- seed.sql — Realistic Seed Data (100+ records)
-- ============================================================================

USE university_management_system;

-- Disable FK checks for bulk insert, re-enable after
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- DEPARTMENTS  (6 rows)
-- ============================================================================
INSERT INTO department (department_id, name, description, office_location, phone, email) VALUES
(1, 'Computer Science',        'CS & Software Engineering',           'Block A, Room 101', '042-111-0001', 'cs@ums.edu.pk'),
(2, 'Electrical Engineering',  'EE, Power Systems & Electronics',     'Block B, Room 201', '042-111-0002', 'ee@ums.edu.pk'),
(3, 'Business Administration', 'Management, Finance & Marketing',     'Block C, Room 301', '042-111-0003', 'ba@ums.edu.pk'),
(4, 'Mathematics',             'Pure & Applied Mathematics',          'Block A, Room 105', '042-111-0004', 'math@ums.edu.pk'),
(5, 'English',                 'Literature, Linguistics & Writing',   'Block D, Room 401', '042-111-0005', 'eng@ums.edu.pk'),
(6, 'Physics',                 'Theoretical & Experimental Physics',  'Block B, Room 210', '042-111-0006', 'phy@ums.edu.pk');

-- ============================================================================
-- PROGRAMS  (8 rows)
-- ============================================================================
INSERT INTO program (program_id, name, department_id, degree_type, duration_years, total_credits) VALUES
(1, 'Computer Science',                1, 'BS',  4, 136),
(2, 'Software Engineering',            1, 'BS',  4, 132),
(3, 'Electrical Engineering',          2, 'BS',  4, 140),
(4, 'Business Administration',         3, 'BS',  4, 124),
(5, 'Computer Science',                1, 'MS',  2,  30),
(6, 'Data Science',                    1, 'MS',  2,  32),
(7, 'Mathematics',                     4, 'BS',  4, 128),
(8, 'English Literature',              5, 'BS',  4, 120);

-- ============================================================================
-- INSTRUCTORS  (12 rows)
-- ============================================================================
INSERT INTO instructor (instructor_id, first_name, last_name, email, phone, department_id, hire_date, designation, salary) VALUES
(1,  'Ahmed',   'Khan',     'ahmed.khan@ums.edu.pk',     '0300-1111111', 1, '2015-08-15', 'Professor',             250000.00),
(2,  'Sara',    'Ali',      'sara.ali@ums.edu.pk',       '0301-2222222', 1, '2018-01-10', 'Assistant Professor',   150000.00),
(3,  'Usman',   'Tariq',    'usman.tariq@ums.edu.pk',    '0302-3333333', 1, '2020-06-01', 'Lecturer',              100000.00),
(4,  'Fatima',  'Noor',     'fatima.noor@ums.edu.pk',    '0303-4444444', 2, '2016-09-01', 'Associate Professor',   200000.00),
(5,  'Hassan',  'Raza',     'hassan.raza@ums.edu.pk',    '0304-5555555', 2, '2019-03-15', 'Lecturer',              110000.00),
(6,  'Ayesha',  'Malik',    'ayesha.malik@ums.edu.pk',   '0305-6666666', 3, '2017-07-20', 'Professor',             240000.00),
(7,  'Bilal',   'Hussain',  'bilal.hussain@ums.edu.pk',  '0306-7777777', 3, '2021-01-05', 'Lecturer',               95000.00),
(8,  'Zainab',  'Shah',     'zainab.shah@ums.edu.pk',    '0307-8888888', 4, '2014-02-28', 'Professor',             260000.00),
(9,  'Imran',   'Qureshi',  'imran.qureshi@ums.edu.pk',  '0308-9999999', 4, '2022-08-01', 'Lecturer',              90000.00),
(10, 'Nadia',   'Jamil',    'nadia.jamil@ums.edu.pk',    '0309-1010101', 5, '2018-11-12', 'Assistant Professor',   140000.00),
(11, 'Tariq',   'Mehmood',  'tariq.mehmood@ums.edu.pk',  '0310-1212121', 6, '2013-05-01', 'Professor',             270000.00),
(12, 'Sana',    'Aslam',    'sana.aslam@ums.edu.pk',     '0311-1313131', 6, '2021-09-01', 'Visiting Faculty',       80000.00);

-- ============================================================================
-- STUDENTS  (25 rows)
-- ============================================================================
INSERT INTO student (student_id, first_name, last_name, email, phone, dob, gender, address, city, program_id, enrollment_date, current_semester, cgpa, status) VALUES
(1,  'Ali',      'Ahmad',    'ali.ahmad@stu.ums.edu.pk',      '0321-0000001', '2003-03-15', 'Male',   '12 Gulberg III',          'Lahore',      1, '2022-09-01', 5, 3.45, 'Active'),
(2,  'Hira',     'Batool',   'hira.batool@stu.ums.edu.pk',    '0321-0000002', '2003-07-22', 'Female', '45 DHA Phase 5',          'Lahore',      1, '2022-09-01', 5, 3.78, 'Active'),
(3,  'Fahad',    'Mirza',    'fahad.mirza@stu.ums.edu.pk',    '0321-0000003', '2002-11-03', 'Male',   '8 Model Town',            'Lahore',      2, '2022-09-01', 5, 2.90, 'Active'),
(4,  'Maryam',   'Iqbal',    'maryam.iqbal@stu.ums.edu.pk',   '0321-0000004', '2004-01-30', 'Female', '90 Johar Town',           'Lahore',      1, '2023-09-01', 3, 3.60, 'Active'),
(5,  'Omar',     'Farooq',   'omar.farooq@stu.ums.edu.pk',    '0321-0000005', '2003-05-18', 'Male',   '23 Cantt Area',           'Rawalpindi',  3, '2022-09-01', 5, 3.10, 'Active'),
(6,  'Zara',     'Siddiqui', 'zara.siddiqui@stu.ums.edu.pk',  '0321-0000006', '2003-09-10', 'Female', '56 F-8 Markaz',           'Islamabad',   4, '2022-09-01', 5, 3.55, 'Active'),
(7,  'Danish',   'Hameed',   'danish.hameed@stu.ums.edu.pk',   '0321-0000007', '2002-12-25', 'Male',   '11 Bahria Town',          'Lahore',      3, '2022-09-01', 5, 2.65, 'Active'),
(8,  'Amna',     'Rashid',   'amna.rashid@stu.ums.edu.pk',    '0321-0000008', '2004-04-14', 'Female', '77 Garden Town',          'Lahore',      2, '2023-09-01', 3, 3.82, 'Active'),
(9,  'Hamza',    'Sheikh',   'hamza.sheikh@stu.ums.edu.pk',   '0321-0000009', '2001-06-06', 'Male',   '3 Satellite Town',        'Rawalpindi',  5, '2024-02-01', 2, 3.70, 'Active'),
(10, 'Khadija',  'Anwar',    'khadija.anwar@stu.ums.edu.pk',  '0321-0000010', '2003-08-20', 'Female', '19 Allama Iqbal Town',    'Lahore',      7, '2022-09-01', 5, 3.25, 'Active'),
(11, 'Saad',     'Butt',     'saad.butt@stu.ums.edu.pk',      '0321-0000011', '2004-02-11', 'Male',   '62 Wapda Town',           'Lahore',      1, '2023-09-01', 3, 3.15, 'Active'),
(12, 'Noor',     'Fatima',   'noor.fatima@stu.ums.edu.pk',    '0321-0000012', '2003-10-05', 'Female', '28 Iqbal Avenue',         'Lahore',      4, '2022-09-01', 5, 3.90, 'Active'),
(13, 'Talha',    'Naveed',   'talha.naveed@stu.ums.edu.pk',   '0321-0000013', '2002-01-17', 'Male',   '44 Askari 11',            'Lahore',      6, '2024-02-01', 2, 3.50, 'Active'),
(14, 'Iqra',     'Zahid',    'iqra.zahid@stu.ums.edu.pk',     '0321-0000014', '2003-12-09', 'Female', '15 Township',             'Lahore',      8, '2022-09-01', 5, 3.35, 'Active'),
(15, 'Usman',    'Ghani',    'usman.ghani@stu.ums.edu.pk',    '0321-0000015', '2004-06-21', 'Male',   '88 Faisal Town',          'Lahore',      1, '2023-09-01', 3, 2.80, 'Active'),
(16, 'Mahnoor',  'Akram',    'mahnoor.akram@stu.ums.edu.pk',  '0321-0000016', '2001-03-03', 'Female', '7 Cavalry Ground',        'Lahore',      5, '2024-09-01', 1, 0.00, 'Active'),
(17, 'Rehan',    'Aziz',     'rehan.aziz@stu.ums.edu.pk',     '0321-0000017', '2000-09-28', 'Male',   '33 Peoples Colony',       'Faisalabad',  1, '2020-09-01', 8, 3.05, 'Graduated'),
(18, 'Saba',     'Riaz',     'saba.riaz@stu.ums.edu.pk',      '0321-0000018', '2001-11-14', 'Female', '51 Shadman',              'Lahore',      4, '2020-09-01', 8, 3.72, 'Graduated'),
(19, 'Waqas',    'Javed',    'waqas.javed@stu.ums.edu.pk',    '0321-0000019', '2003-04-07', 'Male',   '14 Samanabad',            'Lahore',      3, '2022-09-01', 5, 1.85, 'Suspended'),
(20, 'Aisha',    'Parveen',  'aisha.parveen@stu.ums.edu.pk',  '0321-0000020', '2004-08-16', 'Female', '70 Gulshan-e-Ravi',       'Lahore',      1, '2023-09-01', 3, 3.48, 'Active'),
(21, 'Kashif',   'Mahmood',  'kashif.mahmood@stu.ums.edu.pk', '0321-0000021', '2003-02-02', 'Male',   '26 Muslim Town',          'Lahore',      2, '2022-09-01', 5, 3.20, 'Active'),
(22, 'Rabia',    'Nawaz',    'rabia.nawaz@stu.ums.edu.pk',     '0321-0000022', '2004-10-19', 'Female', '5 Raiwind Road',          'Lahore',      7, '2023-09-01', 3, 3.00, 'Active'),
(23, 'Junaid',   'Saleem',   'junaid.saleem@stu.ums.edu.pk',  '0321-0000023', '2003-07-08', 'Male',   '41 Thokar Niaz Baig',     'Lahore',      3, '2022-09-01', 5, 2.55, 'Active'),
(24, 'Hafsa',    'Tariq',    'hafsa.tariq@stu.ums.edu.pk',    '0321-0000024', '2004-05-25', 'Female', '99 Shad Bagh',            'Lahore',      1, '2023-09-01', 3, 3.65, 'Active'),
(25, 'Yasir',    'Abbas',    'yasir.abbas@stu.ums.edu.pk',    '0321-0000025', '2003-01-12', 'Male',   '60 Dharampura',           'Lahore',      4, '2022-09-01', 5, 2.95, 'Active');

-- ============================================================================
-- COURSES  (15 rows)
-- ============================================================================
INSERT INTO course (course_id, course_code, name, description, credits, department_id, is_elective) VALUES
(1,  'CS101',   'Introduction to Computing',      'Basics of computer science and programming',    3, 1, FALSE),
(2,  'CS201',   'Data Structures & Algorithms',    'Arrays, trees, graphs, sorting, searching',    3, 1, FALSE),
(3,  'CS301',   'Database Systems',                'Relational model, SQL, normalization, ACID',   3, 1, FALSE),
(4,  'CS401',   'Software Engineering',            'SDLC, agile, requirements, testing',           3, 1, FALSE),
(5,  'CS351',   'Operating Systems',               'Process management, memory, file systems',     3, 1, FALSE),
(6,  'EE101',   'Circuit Analysis',                'DC/AC circuit fundamentals',                   3, 2, FALSE),
(7,  'EE201',   'Digital Logic Design',            'Boolean algebra, combinational & sequential',  3, 2, FALSE),
(8,  'BA101',   'Principles of Management',        'Planning, organizing, leading, controlling',   3, 3, FALSE),
(9,  'BA201',   'Financial Accounting',            'Accounting cycle, financial statements',       3, 3, FALSE),
(10, 'MTH101',  'Calculus I',                      'Limits, derivatives, integrals',               3, 4, FALSE),
(11, 'MTH201',  'Linear Algebra',                  'Vectors, matrices, eigenvalues',               3, 4, FALSE),
(12, 'ENG101',  'English Composition',             'Essay writing, grammar, rhetoric',             3, 5, FALSE),
(13, 'PHY101',  'Physics I',                       'Mechanics, thermodynamics',                    3, 6, FALSE),
(14, 'CS450',   'Machine Learning',                'Supervised & unsupervised learning',           3, 1, TRUE),
(15, 'CS460',   'Cloud Computing',                 'Virtualization, containers, AWS/GCP',          3, 1, TRUE);

-- ============================================================================
-- COURSE_PREREQUISITES  (6 rows)
-- ============================================================================
INSERT INTO course_prerequisite (course_id, prerequisite_id) VALUES
(2,  1),   -- DS&A requires Intro to Computing
(3,  2),   -- Database Systems requires DS&A
(4,  2),   -- SE requires DS&A
(5,  2),   -- OS requires DS&A
(14, 2),   -- ML requires DS&A
(7,  6);   -- DLD requires Circuit Analysis

-- ============================================================================
-- SECTIONS  (18 rows)
-- ============================================================================
INSERT INTO section (section_id, course_id, instructor_id, semester, year, schedule_days, schedule_time, room, capacity, enrolled_count) VALUES
(1,  1,  3,  'Fall',   2025, 'Mon/Wed',   '08:30:00', 'A-101',  50, 5),
(2,  1,  2,  'Fall',   2025, 'Tue/Thu',   '10:00:00', 'A-102',  50, 4),
(3,  2,  2,  'Fall',   2025, 'Mon/Wed',   '10:00:00', 'A-103',  45, 5),
(4,  3,  1,  'Fall',   2025, 'Tue/Thu',   '11:30:00', 'A-201',  40, 5),
(5,  4,  1,  'Fall',   2025, 'Mon/Wed',   '14:00:00', 'A-202',  40, 3),
(6,  5,  3,  'Fall',   2025, 'Tue/Thu',   '08:30:00', 'A-103',  45, 3),
(7,  6,  4,  'Fall',   2025, 'Mon/Wed',   '08:30:00', 'B-101',  50, 3),
(8,  7,  5,  'Fall',   2025, 'Tue/Thu',   '10:00:00', 'B-102',  45, 2),
(9,  8,  6,  'Fall',   2025, 'Mon/Wed',   '10:00:00', 'C-101',  60, 3),
(10, 9,  7,  'Fall',   2025, 'Tue/Thu',   '14:00:00', 'C-102',  55, 2),
(11, 10, 8,  'Fall',   2025, 'Mon/Wed',   '11:30:00', 'A-301',  60, 3),
(12, 11, 9,  'Fall',   2025, 'Tue/Thu',   '11:30:00', 'A-302',  50, 2),
(13, 12, 10, 'Fall',   2025, 'Mon/Wed',   '14:00:00', 'D-101',  55, 2),
(14, 13, 11, 'Fall',   2025, 'Tue/Thu',   '14:00:00', 'B-201',  50, 2),
(15, 14, 1,  'Fall',   2025, 'Fri',       '09:00:00', 'A-401',  35, 2),
(16, 15, 2,  'Fall',   2025, 'Fri',       '11:00:00', 'A-402',  35, 2),
(17, 3,  1,  'Spring', 2026, 'Mon/Wed',   '10:00:00', 'A-201',  40, 0),
(18, 10, 8,  'Spring', 2026, 'Tue/Thu',   '08:30:00', 'A-301',  60, 0);

-- ============================================================================
-- ENROLLMENTS  (50 rows)
-- ============================================================================
INSERT INTO enrollment (enrollment_id, student_id, section_id, enrollment_date, grade, grade_points, status) VALUES
-- Section 1: CS101 Fall 2025 (5 students)
(1,  4,  1,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(2,  11, 1,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(3,  15, 1,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(4,  20, 1,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(5,  24, 1,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 2: CS101 Fall 2025 (4 students)
(6,  8,  2,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(7,  22, 2,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(8,  10, 2,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(9,  14, 2,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 3: DS&A Fall 2025 (5 students)
(10, 1,  3,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(11, 2,  3,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(12, 3,  3,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(13, 21, 3,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(14, 5,  3,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 4: Database Systems Fall 2025 (5 students)
(15, 1,  4,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(16, 2,  4,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(17, 3,  4,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(18, 21, 4,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(19, 5,  4,  '2025-08-25', 'W',   NULL, 'Withdrawn'),
-- Section 5: SE Fall 2025 (3 students)
(20, 1,  5,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(21, 2,  5,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(22, 21, 5,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 6: OS Fall 2025 (3 students)
(23, 1,  6,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(24, 2,  6,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(25, 3,  6,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 7: Circuit Analysis (3 students)
(26, 5,  7,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(27, 7,  7,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(28, 23, 7,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 8: DLD (2 students)
(29, 5,  8,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(30, 7,  8,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 9: Principles of Management (3 students)
(31, 6,  9,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(32, 12, 9,  '2025-08-25', NULL,  NULL, 'Enrolled'),
(33, 25, 9,  '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 10: Financial Accounting (2 students)
(34, 6,  10, '2025-08-25', NULL,  NULL, 'Enrolled'),
(35, 25, 10, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 11: Calculus I (3 students)
(36, 4,  11, '2025-08-25', NULL,  NULL, 'Enrolled'),
(37, 10, 11, '2025-08-25', NULL,  NULL, 'Enrolled'),
(38, 22, 11, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 12: Linear Algebra (2 students)
(39, 10, 12, '2025-08-25', NULL,  NULL, 'Enrolled'),
(40, 22, 12, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 13: English Comp (2 students)
(41, 14, 13, '2025-08-25', NULL,  NULL, 'Enrolled'),
(42, 4,  13, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 14: Physics I (2 students)
(43, 5,  14, '2025-08-25', NULL,  NULL, 'Enrolled'),
(44, 23, 14, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 15: Machine Learning (2 students)
(45, 9,  15, '2025-08-25', NULL,  NULL, 'Enrolled'),
(46, 13, 15, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Section 16: Cloud Computing (2 students)
(47, 9,  16, '2025-08-25', NULL,  NULL, 'Enrolled'),
(48, 13, 16, '2025-08-25', NULL,  NULL, 'Enrolled'),
-- Graduated students' past enrollments (completed)
(49, 17, 1,  '2020-09-01', 'A',   4.00, 'Completed'),
(50, 18, 9,  '2020-09-01', 'A-',  3.67, 'Completed');

-- ============================================================================
-- ATTENDANCE  (30 rows — sample for a few enrollments)
-- ============================================================================
INSERT INTO attendance (enrollment_id, attendance_date, status) VALUES
-- Enrollment 1 (student 4, section 1)
(1,  '2025-09-01', 'Present'),
(1,  '2025-09-03', 'Present'),
(1,  '2025-09-08', 'Absent'),
(1,  '2025-09-10', 'Present'),
(1,  '2025-09-15', 'Late'),
-- Enrollment 10 (student 1, section 3)
(10, '2025-09-01', 'Present'),
(10, '2025-09-03', 'Present'),
(10, '2025-09-08', 'Present'),
(10, '2025-09-10', 'Present'),
(10, '2025-09-15', 'Excused'),
-- Enrollment 15 (student 1, section 4)
(15, '2025-09-02', 'Present'),
(15, '2025-09-04', 'Present'),
(15, '2025-09-09', 'Absent'),
(15, '2025-09-11', 'Present'),
(15, '2025-09-16', 'Present'),
-- Enrollment 11 (student 2, section 3)
(11, '2025-09-01', 'Present'),
(11, '2025-09-03', 'Present'),
(11, '2025-09-08', 'Present'),
(11, '2025-09-10', 'Late'),
(11, '2025-09-15', 'Present'),
-- Enrollment 26 (student 5, section 7)
(26, '2025-09-01', 'Present'),
(26, '2025-09-03', 'Present'),
(26, '2025-09-08', 'Absent'),
(26, '2025-09-10', 'Present'),
(26, '2025-09-15', 'Present'),
-- Enrollment 31 (student 6, section 9)
(31, '2025-09-01', 'Present'),
(31, '2025-09-03', 'Present'),
(31, '2025-09-08', 'Present'),
(31, '2025-09-10', 'Absent'),
(31, '2025-09-15', 'Present');

-- ============================================================================
-- ASSIGNMENTS  (12 rows)
-- ============================================================================
INSERT INTO assignment (assignment_id, section_id, title, description, max_marks, weightage, due_date) VALUES
(1,  1,  'HW1: Python Basics',          'Write basic Python programs',             100.00, 5.00,  '2025-09-15 23:59:00'),
(2,  1,  'HW2: Control Structures',     'Loops and conditionals exercises',        100.00, 5.00,  '2025-10-01 23:59:00'),
(3,  3,  'HW1: Linked Lists',           'Implement singly & doubly linked lists',  100.00, 7.50,  '2025-09-20 23:59:00'),
(4,  3,  'HW2: Trees & Graphs',         'BST and BFS/DFS implementation',          100.00, 7.50,  '2025-10-15 23:59:00'),
(5,  4,  'HW1: ER Diagrams',            'Design an ER diagram for a hospital',     100.00, 10.00, '2025-09-22 23:59:00'),
(6,  4,  'HW2: SQL Queries',            'Write complex SQL queries',               100.00, 10.00, '2025-10-20 23:59:00'),
(7,  5,  'HW1: Requirements Spec',      'Write an SRS document',                   100.00, 8.00,  '2025-09-25 23:59:00'),
(8,  7,  'Lab1: KVL & KCL',             'Solve circuit problems',                  50.00,  5.00,  '2025-09-18 23:59:00'),
(9,  9,  'Case Study: Leadership',       'Analyse a leadership case study',        100.00, 10.00, '2025-09-28 23:59:00'),
(10, 11, 'Problem Set 1: Limits',        'Solve limits problems',                  100.00, 5.00,  '2025-09-17 23:59:00'),
(11, 15, 'Project: Classification Model','Build a classifier on given dataset',    200.00, 25.00, '2025-11-15 23:59:00'),
(12, 4,  'Midterm Project: DB Design',   'Design & implement a full database',     200.00, 20.00, '2025-11-01 23:59:00');

-- ============================================================================
-- SUBMISSIONS  (20 rows)
-- ============================================================================
INSERT INTO submission (assignment_id, student_id, submission_date, marks_obtained, feedback, is_late) VALUES
-- Assignment 1 (HW1 Python Basics, section 1)
(1,  4,  '2025-09-14 22:30:00', 88.00, 'Good work, minor formatting issues',   FALSE),
(1,  11, '2025-09-15 23:55:00', 75.00, 'Some logic errors in Q3',              FALSE),
(1,  15, '2025-09-16 02:10:00', 65.00, 'Late submission, missing Q4',          TRUE),
(1,  20, '2025-09-15 18:00:00', 92.00, 'Excellent!',                           FALSE),
(1,  24, '2025-09-15 20:00:00', 85.00, 'Well structured code',                 FALSE),
-- Assignment 3 (HW1 Linked Lists, section 3)
(3,  1,  '2025-09-19 21:00:00', 95.00, 'Perfect implementation',               FALSE),
(3,  2,  '2025-09-20 10:00:00', 90.00, 'Clean code, well commented',           FALSE),
(3,  3,  '2025-09-20 23:50:00', 72.00, 'Doubly linked list has bugs',          FALSE),
(3,  21, '2025-09-21 01:00:00', 68.00, 'Late, incomplete DLL',                 TRUE),
-- Assignment 5 (HW1 ER Diagrams, section 4)
(5,  1,  '2025-09-21 15:00:00', 85.00, 'Good ER, missing one relationship',    FALSE),
(5,  2,  '2025-09-22 12:00:00', 98.00, 'Excellent ER diagram!',                FALSE),
(5,  3,  '2025-09-22 22:00:00', 78.00, 'Cardinalities need review',            FALSE),
(5,  21, '2025-09-22 23:00:00', 82.00, 'Good effort, minor issues',            FALSE),
-- Assignment 8 (Lab1 KVL, section 7)
(8,  5,  '2025-09-17 16:00:00', 45.00, 'Good lab work',                        FALSE),
(8,  7,  '2025-09-18 10:00:00', 38.00, 'Partial solutions',                    FALSE),
(8,  23, '2025-09-18 23:50:00', 42.00, 'Decent attempt',                       FALSE),
-- Assignment 9 (Case Study, section 9)
(9,  6,  '2025-09-27 20:00:00', 88.00, 'Thoughtful analysis',                  FALSE),
(9,  12, '2025-09-28 08:00:00', 95.00, 'Outstanding case study!',              FALSE),
-- Assignment 10 (Calculus, section 11)
(10, 4,  '2025-09-16 22:00:00', 70.00, 'Good but check Q5',                    FALSE),
(10, 10, '2025-09-17 14:00:00', 82.00, 'Well done',                            FALSE);

-- ============================================================================
-- FEES  (25 rows — one per student for Fall 2025)
-- ============================================================================
INSERT INTO fee (student_id, semester, year, total_amount, paid_amount, due_date, payment_date, status) VALUES
(1,  'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-10', 'Paid'),
(2,  'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-12', 'Paid'),
(3,  'Fall', 2025, 185000.00, 100000.00, '2025-09-15', '2025-09-14', 'Partial'),
(4,  'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-08', 'Paid'),
(5,  'Fall', 2025, 195000.00, 195000.00, '2025-09-15', '2025-09-13', 'Paid'),
(6,  'Fall', 2025, 175000.00, 175000.00, '2025-09-15', '2025-09-11', 'Paid'),
(7,  'Fall', 2025, 195000.00,      0.00, '2025-09-15', NULL,         'Overdue'),
(8,  'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-09', 'Paid'),
(9,  'Fall', 2025, 210000.00, 210000.00, '2025-09-15', '2025-09-14', 'Paid'),
(10, 'Fall', 2025, 170000.00, 170000.00, '2025-09-15', '2025-09-07', 'Paid'),
(11, 'Fall', 2025, 185000.00,  90000.00, '2025-09-15', '2025-09-15', 'Partial'),
(12, 'Fall', 2025, 175000.00, 175000.00, '2025-09-15', '2025-09-10', 'Paid'),
(13, 'Fall', 2025, 210000.00, 210000.00, '2025-09-15', '2025-09-12', 'Paid'),
(14, 'Fall', 2025, 160000.00, 160000.00, '2025-09-15', '2025-09-11', 'Paid'),
(15, 'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-14', 'Paid'),
(16, 'Fall', 2025, 210000.00,      0.00, '2025-09-15', NULL,         'Pending'),
(17, 'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-05', 'Paid'),
(18, 'Fall', 2025, 175000.00, 175000.00, '2025-09-15', '2025-09-06', 'Paid'),
(19, 'Fall', 2025, 195000.00,      0.00, '2025-09-15', NULL,         'Overdue'),
(20, 'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-13', 'Paid'),
(21, 'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-14', 'Paid'),
(22, 'Fall', 2025, 170000.00, 130000.00, '2025-09-15', '2025-09-15', 'Partial'),
(23, 'Fall', 2025, 195000.00, 195000.00, '2025-09-15', '2025-09-10', 'Paid'),
(24, 'Fall', 2025, 185000.00, 185000.00, '2025-09-15', '2025-09-09', 'Paid'),
(25, 'Fall', 2025, 175000.00, 175000.00, '2025-09-15', '2025-09-12', 'Paid');

-- ============================================================================
-- BOOKS  (10 rows)
-- ============================================================================
INSERT INTO book (book_id, title, author, isbn, publisher, publish_year, category, total_copies, available_copies) VALUES
(1,  'Introduction to Algorithms',          'Thomas H. Cormen',       '978-0262033848', 'MIT Press',         2009, 'Computer Science',   5, 5),
(2,  'Database System Concepts',            'Abraham Silberschatz',   '978-0078022159', 'McGraw-Hill',       2019, 'Computer Science',   4, 4),
(3,  'Clean Code',                          'Robert C. Martin',       '978-0132350884', 'Prentice Hall',     2008, 'Software Engineering',3, 3),
(4,  'Fundamentals of Electric Circuits',   'Charles Alexander',      '978-0078028229', 'McGraw-Hill',       2016, 'Electrical Eng',     4, 4),
(5,  'Principles of Management',            'Robbins & Coulter',      '978-0134527604', 'Pearson',           2017, 'Business',           6, 6),
(6,  'Calculus: Early Transcendentals',     'James Stewart',          '978-1285741550', 'Cengage',           2015, 'Mathematics',        5, 5),
(7,  'University Physics',                  'Young & Freedman',       '978-0321973610', 'Pearson',           2015, 'Physics',            4, 4),
(8,  'Operating System Concepts',           'Silberschatz et al.',    '978-1119800361', 'Wiley',             2021, 'Computer Science',   3, 3),
(9,  'Artificial Intelligence: A Modern Approach', 'Russell & Norvig','978-0134610993', 'Pearson',           2020, 'Computer Science',   3, 3),
(10, 'The Elements of Style',              'Strunk & White',          '978-0205309023', 'Longman',           1999, 'English',            5, 5);

-- ============================================================================
-- BOOK_ISSUES  (8 rows)
-- NOTE: We disable triggers temporarily so available_copies stays consistent
--       with our manually set data. In production, triggers handle this.
-- ============================================================================
-- Manually adjust available copies for issued books
UPDATE book SET available_copies = 3 WHERE book_id = 1;  -- 2 issued
UPDATE book SET available_copies = 2 WHERE book_id = 2;  -- 2 issued
UPDATE book SET available_copies = 2 WHERE book_id = 3;  -- 1 issued
UPDATE book SET available_copies = 3 WHERE book_id = 4;  -- 1 issued
UPDATE book SET available_copies = 5 WHERE book_id = 5;  -- 1 issued, 1 returned

INSERT INTO book_issue (issue_id, book_id, student_id, issue_date, due_date, return_date, fine) VALUES
(1, 1,  1,  '2025-09-05', '2025-09-19', NULL,         0.00),
(2, 1,  2,  '2025-09-06', '2025-09-20', NULL,         0.00),
(3, 2,  1,  '2025-09-08', '2025-09-22', NULL,         0.00),
(4, 2,  3,  '2025-09-07', '2025-09-21', NULL,         0.00),
(5, 3,  21, '2025-09-10', '2025-09-24', NULL,         0.00),
(6, 4,  5,  '2025-09-05', '2025-09-19', NULL,         0.00),
(7, 5,  6,  '2025-09-03', '2025-09-17', '2025-09-16', 0.00),
(8, 5,  12, '2025-09-04', '2025-09-18', '2025-09-25', 70.00);  -- 7 days late × 10

-- ============================================================================
-- HOSTELS  (3 rows)
-- ============================================================================
INSERT INTO hostel (hostel_id, name, hostel_type, total_rooms, warden_name, contact_phone) VALUES
(1, 'Iqbal Hall',    'Male',   60, 'Mr. Khalid Mehmood',  '042-222-0001'),
(2, 'Fatima Hall',   'Female', 50, 'Ms. Rukhsana Bibi',   '042-222-0002'),
(3, 'Jinnah Hall',   'Male',   40, 'Mr. Arif Hussain',    '042-222-0003');

-- ============================================================================
-- HOSTEL_ROOMS  (15 rows)
-- ============================================================================
INSERT INTO hostel_room (room_id, hostel_id, room_number, capacity, current_occupancy, room_type) VALUES
(1,  1, 'IQ-101', 2, 2, 'Double'),
(2,  1, 'IQ-102', 2, 1, 'Double'),
(3,  1, 'IQ-103', 1, 1, 'Single'),
(4,  1, 'IQ-201', 3, 2, 'Triple'),
(5,  1, 'IQ-202', 2, 0, 'Double'),
(6,  2, 'FH-101', 2, 2, 'Double'),
(7,  2, 'FH-102', 2, 1, 'Double'),
(8,  2, 'FH-103', 1, 0, 'Single'),
(9,  2, 'FH-201', 3, 1, 'Triple'),
(10, 2, 'FH-202', 2, 0, 'Double'),
(11, 3, 'JH-101', 2, 1, 'Double'),
(12, 3, 'JH-102', 2, 0, 'Double'),
(13, 3, 'JH-103', 1, 1, 'Single'),
(14, 3, 'JH-201', 3, 0, 'Triple'),
(15, 3, 'JH-202', 2, 0, 'Double');

-- ============================================================================
-- HOSTEL_ALLOCATIONS  (12 rows)
-- ============================================================================
INSERT INTO hostel_allocation (allocation_id, student_id, room_id, alloc_date, vacate_date, status) VALUES
(1,  1,  1,  '2025-08-20', NULL,         'Active'),
(2,  3,  1,  '2025-08-20', NULL,         'Active'),
(3,  5,  2,  '2025-08-20', NULL,         'Active'),
(4,  7,  3,  '2025-08-20', NULL,         'Active'),
(5,  23, 4,  '2025-08-20', NULL,         'Active'),
(6,  25, 4,  '2025-08-20', NULL,         'Active'),
(7,  2,  6,  '2025-08-20', NULL,         'Active'),
(8,  4,  6,  '2025-08-20', NULL,         'Active'),
(9,  6,  7,  '2025-08-20', NULL,         'Active'),
(10, 14, 9,  '2025-08-20', NULL,         'Active'),
(11, 15, 11, '2025-08-20', NULL,         'Active'),
(12, 19, 13, '2025-08-20', '2025-10-01', 'Vacated');  -- suspended student vacated

-- ============================================================================
-- USERS  (4 seed accounts — password for all: Admin@123)
-- ============================================================================
INSERT INTO users (user_id, email, password_hash, role, linked_id) VALUES
(1, 'admin@ums.edu.pk',      '$2b$12$.xlXLETCMzPf6f2bJLL4H.myGVJyo9qbrfSfW7J18Ar3svpaQy6VC', 'Admin',      NULL),
(2, 'ahmed.khan@ums.edu.pk', '$2b$12$.xlXLETCMzPf6f2bJLL4H.myGVJyo9qbrfSfW7J18Ar3svpaQy6VC', 'Instructor', 1),
(3, 'ali.ahmad@stu.ums.edu.pk','$2b$12$.xlXLETCMzPf6f2bJLL4H.myGVJyo9qbrfSfW7J18Ar3svpaQy6VC', 'Student',  1),
(4, 'librarian@ums.edu.pk',  '$2b$12$.xlXLETCMzPf6f2bJLL4H.myGVJyo9qbrfSfW7J18Ar3svpaQy6VC', 'Librarian',  NULL);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- TOTAL RECORD COUNT
-- ============================================================================
-- department:          6
-- program:             8
-- instructor:         12
-- student:            25
-- course:             15
-- course_prerequisite: 6
-- section:            18
-- enrollment:         50
-- attendance:         30
-- assignment:         12
-- submission:         20
-- fee:                25
-- book:               10
-- book_issue:          8
-- hostel:              3
-- hostel_room:        15
-- hostel_allocation:  12
-- users:               4
-- --------------------------------
-- GRAND TOTAL:       279 records
-- ============================================================================
