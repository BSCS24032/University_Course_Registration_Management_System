# University Course Registration Management System

Final submission spanning Phases 1, 2, and 3 of the Advanced Database Management course.

A full-stack system covering authentication, enrollment, grading, library, hostels, and admin management for a university — backed by a normalized (3NF) MySQL schema with triggers and views, a RESTful Node/Express API with ACID transactions and RBAC across four roles, and a React frontend.

---

## Repository Layout

```
University_Course_Registration_Management_System/
├── backend/              Node + Express API (Phase 2)
│   ├── config/           MySQL connection pool
│   ├── controllers/      14 controllers covering every entity
│   ├── middleware/       JWT + RBAC middleware
│   ├── routes/           14 route modules
│   ├── server.js
│   ├── swagger.yaml      OpenAPI 3.0 spec
│   └── README.md         Backend-specific setup and endpoint reference
│
├── frontend/             React + Vite (Phase 3)
│
├── schema.sql            Phase 1 schema — 19 tables, 5 views, 5 triggers
├── seed.sql              Phase 1 seed — 350+ records, 39 user accounts
├── performance.sql       Index-tuning queries with EXPLAIN ANALYZE
│
├── ER_Diagram.pdf        Phase 1 deliverable
├── Schema_Documentation.pdf
├── ACID_Documentation.pdf
└── BackEnd_Explaination.pdf   Phase 2 deliverable
```

---

## Quick Start

```bash
# 1. Load schema and seed into MySQL
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql

# 2. Backend
cd backend
cp .env.example .env     # fill in DB credentials + any JWT_SECRET
npm install
npm run dev              # starts on port 5000

# 3. Frontend
cd ../frontend
npm install
npm run dev              # starts on port 5173
```

Swagger UI: `http://localhost:5000/api-docs`. All 39 seed accounts use password `Admin@123`.

---

## What's in This Version

**Schema**: 19 tables (departments, programs, instructors, students, courses, sections, enrollments, attendance, assignments, submissions, fees, books, book_issues, hostels, hostel_rooms, hostel_allocations, users, course_prerequisite, program_course). Student table includes a per-student `credit_limit` column (Admin-configurable).

**Program-course eligibility**: the new `program_course` table controls which courses each program is allowed to take. The enrollment transaction rejects courses not in a student's program. Admin UI can add or remove courses from programs via `/admin/program-courses`.

**Credit-hour enforcement**: every student has a `credit_limit` (default 18, range 0–30). The enrollment transaction sums a student's currently-enrolled credits and rejects any new enrollment that would exceed the limit. Admin can override a student's limit via `PATCH /admin/students/:id/credit-limit`.

**Grading**:
- `POST /grades/assign` — assign a single letter grade, auto-recalculate CGPA
- `POST /grades/apply-threshold` — bulk-grade a whole section by computing weighted percentages and mapping to letter grades via instructor-supplied cutoffs (all atomic)
- `GET /grades/sections/:id/average` and `GET /grades/courses/:id/average` — return AVG/MIN/MAX grade-points
- `GET /grades/sections/:id/grade-sheet` — full student-by-student breakdown

**ACID transactions** (six distinct scenarios): enrollment, drop, fee payment, grade threshold application, book issue/return, hostel allocation.

**Full role coverage**:
- *Admin* — department/program/instructor/student CRUD, program-course mapping, credit-limit override, stats dashboard, hostel management
- *Instructor* — my sections, roster, assignment creation, submission grading, single/threshold grade assignment, averages, attendance marking
- *Student* — eligible courses, enroll/drop, transcript, credit-load, assignment submission, fee payment, attendance view, book borrowing history
- *Librarian* — book catalogue CRUD, issue/return transactions

**Authentication & authorization**: JWT with bcrypt (12 rounds); RBAC middleware on every protected endpoint; ownership checks so students cannot act on other students' data.

**Database triggers in use**: `trg_before_prereq_insert` (prereq self-reference), `trg_after_enrollment_insert`/`update` (section count), `trg_before_book_issue_insert` (copy availability), `trg_after_book_return` (fine calculation).

**Views in use**: `vw_student_transcript`, `vw_section_roster`, `vw_student_fee_summary`, `vw_student_eligible_courses` (new), `vw_student_current_credits` (new).

See `backend/README.md` for the full endpoint table and `backend/swagger.yaml` for request/response schemas.
