# University Management System — Backend API (Phase 2 / Phase 3)

RESTful API for a University Management System built with Node.js, Express, and MySQL. Uses JWT authentication, RBAC across four roles (Admin, Instructor, Student, Librarian), raw parameterized SQL (no ORM), and ACID transactions for every critical operation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 5 |
| Database | MySQL 8.0+ (InnoDB) |
| DB Driver | mysql2/promise (connection pooling) |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcrypt (12 salt rounds) |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Queries | Raw parameterized SQL — no ORM |

---

## Setup

```bash
# 1. Load schema + seed into MySQL
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql

# 2. Configure env
cd backend
cp .env.example .env
# edit .env with your MySQL credentials + any JWT_SECRET string

# 3. Install and run
npm install
npm run dev      # with nodemon
# or: npm start  # plain node
```

Server comes up on port 5000. Swagger UI: `http://localhost:5000/api-docs`. Health check: `GET /api/v1/health`.

---

## Seed Login Accounts

Every instructor and every student now has a login account. **Password for all 39 accounts is `Admin@123`.**

| Role | Count | Email pattern |
|---|---|---|
| Admin | 1 | `admin@ums.edu.pk` |
| Librarian | 1 | `librarian@ums.edu.pk` |
| Instructor | 12 | `<first>.<last>@ums.edu.pk` — e.g. `ahmed.khan@ums.edu.pk` |
| Student | 25 | `<first>.<last>@stu.ums.edu.pk` — e.g. `ali.ahmad@stu.ums.edu.pk` |

---

## Role Permissions (RBAC)

| Role | What they can do |
|---|---|
| **Admin** | Everything. CRUD on departments, programs, instructors, students; override per-student credit limits; add/remove courses from programs; dashboard stats; pay any fee; hostel allocations. |
| **Instructor** | See their own sections; get rosters; create and delete assignments; grade submissions; assign single grades; apply threshold-based bulk grading; view section/course averages; mark attendance. |
| **Student** | View eligible courses (restricted to their program); enroll/drop (respecting credit-limit, prerequisites, and program-course rules); submit assignments; view transcript and credit load; pay own fees; view own attendance; view own borrowed books. |
| **Librarian** | Full CRUD on the book catalogue; issue books; accept returns; view all issues. |

---

## ACID Transactions

Five distinct transactional flows in the backend, each with `BEGIN` / `COMMIT` / `ROLLBACK`:

1. **Enrollment** (`POST /api/v1/enrollment`) — locks section + student rows, enforces capacity, duplicate-prevention, program-course eligibility, credit-hour limit, and prerequisites. Trigger `trg_after_enrollment_insert` increments `section.enrolled_count`.
2. **Drop Enrollment** (`PATCH /api/v1/enrollment/:id/drop`) — trigger `trg_after_enrollment_update` decrements `section.enrolled_count`.
3. **Fee Payment** (`POST /api/v1/fees/pay`) — integer-arithmetic (paisa) to avoid float-equality bugs; row-level lock on fee voucher; prevents overpayment.
4. **Grade Threshold Application** (`POST /api/v1/grades/apply-threshold`) — computes every enrolled student's weighted percentage, assigns a letter grade based on instructor-supplied cutoffs, recalculates each student's CGPA — all atomic.
5. **Book Issue / Return** (`POST /api/v1/book-issues`, `PATCH /api/v1/book-issues/:id/return`) — triggers `trg_before_book_issue_insert` and `trg_after_book_return` handle `available_copies` and late-fee calculation.
6. **Hostel Allocation** (`POST /api/v1/hostels/allocations`) — atomic capacity check + occupancy increment.

Every controller uses the `getConnection()` → `beginTransaction()` → `try/catch/finally` → `release()` pattern.

---

## Key Features Added in This Revision

- **Program-course restriction** — students can only enroll in courses their program allows (enforced in the enrollment transaction by joining `program_course`).
- **Per-student credit-hour limit** — each student has a `credit_limit` column (default 18, Admin can override). Enrollment refuses courses that would put the student over.
- **Grade threshold grading** — `POST /grades/apply-threshold` takes a JSON map like `{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}` and a `section_id`, then atomically assigns grades to every enrolled student based on their weighted assignment average.
- **Single grade assignment** — `POST /grades/assign` with `{enrollment_id, grade}` updates the enrollment and recalculates the student's CGPA.
- **Averages** — `GET /grades/sections/:id/average` and `GET /grades/courses/:id/average` return AVG/MIN/MAX of grade-points.
- **Admin stats dashboard** — `GET /admin/stats` returns counts, per-department breakdowns, fee summary, and top-enrolled courses.
- **Full Librarian workflow** — every book CRUD operation plus transactional issue/return.
- **Assignments & submissions** — Instructors create assignments, Students submit them (server computes `is_late`), Instructors grade submissions.
- **Login accounts for every student and instructor** — seed expanded from 4 to 39 users.
- **Drop enrollment endpoint** and **student transcript endpoint** using Phase-1 views.

---

## Endpoint Summary

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public / Admin for elevated | Register user |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/courses` | Any | List courses |
| GET | `/courses/sections` | Any | List sections |
| GET | `/courses/eligible` | Student | Program-eligible courses |
| GET | `/courses/:id/prerequisites` | Any | Prerequisite list |
| POST | `/enrollment` | Admin, Student | Enroll (ACID) |
| GET | `/enrollment/my` | Student | My enrollments |
| PATCH | `/enrollment/:id/drop` | Admin, Student | Drop |
| POST | `/fees/pay` | Admin, Student | Pay fees (ACID) |
| GET | `/fees/my-fees` | Student | My fee vouchers |
| POST | `/attendance` | Instructor | Mark attendance |
| GET | `/attendance/my-records` | Student | My attendance |
| POST | `/assignments` | Instructor, Admin | Create assignment |
| GET | `/assignments/section/:id` | Any | List section assignments |
| GET | `/assignments/my` | Student | My assignments |
| DELETE | `/assignments/:id` | Instructor, Admin | Delete |
| POST | `/submissions` | Student | Submit |
| PUT | `/submissions/:id/grade` | Instructor, Admin | Grade submission |
| GET | `/submissions/assignment/:id` | Instructor, Admin | List submissions |
| POST | `/grades/assign` | Instructor, Admin | Assign single grade |
| POST | `/grades/apply-threshold` | Instructor, Admin | Bulk grade by threshold (ACID) |
| GET | `/grades/sections/:id/average` | Instructor, Admin | Section average |
| GET | `/grades/sections/:id/grade-sheet` | Instructor, Admin | Grade sheet |
| GET | `/grades/courses/:id/average` | Instructor, Admin | Course average |
| GET | `/books` | Any | Browse catalogue |
| POST | `/books` | Librarian, Admin | Add book |
| PUT/DELETE | `/books/:id` | Librarian, Admin | Update/delete |
| POST | `/book-issues` | Librarian, Admin | Issue book (ACID) |
| PATCH | `/book-issues/:id/return` | Librarian, Admin | Return (ACID) |
| GET | `/book-issues` | Librarian, Admin | All issues |
| GET | `/book-issues/my` | Student | My borrowing history |
| GET | `/admin/stats` | Admin | Dashboard stats |
| GET/POST/PUT/DELETE | `/admin/departments` | Admin | Department CRUD |
| GET/POST/DELETE | `/admin/programs` | Admin | Program CRUD |
| POST/DELETE | `/admin/program-courses` | Admin | Program-course mapping |
| GET/POST/PUT | `/admin/instructors` | Admin | Instructor CRUD |
| GET/PUT | `/admin/students[/:id]` | Admin | Student CRUD |
| PATCH | `/admin/students/:id/credit-limit` | Admin | Override credit limit |
| GET/POST/PATCH | `/hostels/...` | Admin | Hostel management |
| GET | `/instructors/me/sections` | Instructor, Admin | My sections |
| GET | `/instructors/sections/:id/roster` | Instructor, Admin | Roster |
| GET | `/students/me/transcript` | Student | Transcript (view) |
| GET | `/students/me/credit-load` | Student | Credit load (view) |
| GET | `/students/me/profile` | Student | Profile |

See `swagger.yaml` / `/api-docs` for request/response schemas.
