# UMS v2 — Integration Guide

This folder is a **drop-in addition** to your existing
`University_Course_Registration_Management_System` project. Everything here
either adds new files or replaces existing ones. No files from Phase 1 or
Phase 2 are deleted — the original 19 tables, 5 views, 5 triggers, and all
previous controllers still work unchanged.

## Step 1 — Database

```bash
# Run AFTER your existing schema.sql and seed.sql
mysql -u root -p < Database/migration_v2.sql
```

Adds 6 new tables (`semester`, `announcement`, `feedback`, `notification`,
`exam`, `waitlist`), 2 new views, 1 new trigger that auto-promotes from the
waitlist on drop, and seed data — including three semesters (Spring 2026 is
Active with its registration window currently open), four announcements, six
scheduled exams, and notifications for every seeded user.

## Step 2 — Backend

Copy the following files into your `backend/` folder, overwriting where noted:

**New files:**
- `backend/controllers/semesterController.js`
- `backend/controllers/announcementController.js`
- `backend/controllers/notificationController.js`
- `backend/controllers/feedbackController.js`
- `backend/controllers/examController.js`
- `backend/controllers/waitlistController.js`
- `backend/controllers/timetableController.js`
- `backend/controllers/transcriptController.js`
- `backend/controllers/adminExtrasController.js`
- `backend/routes/semesterRoutes.js`
- `backend/routes/announcementRoutes.js`
- `backend/routes/notificationRoutes.js`
- `backend/routes/feedbackRoutes.js`
- `backend/routes/examRoutes.js`
- `backend/routes/waitlistRoutes.js`
- `backend/routes/timetableRoutes.js`
- `backend/routes/transcriptRoutes.js`
- `backend/routes/adminExtrasRoutes.js`

**Overwrite:**
- `backend/server.js` — now mounts the 8 new route modules
- `backend/controllers/enrollmentController.js` — now checks the active
  semester's registration window, returns HTTP 409 with a `SECTION_FULL:` prefix
  so the frontend can offer waitlist enrollment, enforces the add/drop deadline
  on student-initiated drops, and posts an in-app notification on success.

**No new dependencies** — everything uses `mysql2`, `bcrypt`, `jsonwebtoken`,
`express`, and `cors` that you already have.

## Step 3 — Frontend

Copy the following into `frontend/src/`, overwriting where noted:

**New files:**
- `styles/global.css` — academic palette, layout grid, tables, forms, badges,
  sidebar, topbar, loading spinner, timetable grid, login card, stars
- `components/Layout.jsx` — sidebar + topbar shell used by every page
- `components/Loading.jsx` — spinner + message
- `components/ErrorMessage.jsx` — red alert with retry
- `components/EmptyState.jsx`
- `components/BarChart.jsx` — pure-SVG horizontal bar chart
- `components/LineChart.jsx` — pure-SVG line chart
- `components/NotificationBell.jsx` — bell with 30s polling + dropdown
- `pages/Announcements.jsx`
- `pages/Timetable.jsx`
- `pages/Feedback.jsx` (student side)
- `pages/MyFeedback.jsx` (instructor side — aggregate only)
- `pages/Exams.jsx`
- `pages/Notifications.jsx`
- `pages/Transcript.jsx`
- `pages/AdminSemesters.jsx`
- `pages/AdminProbation.jsx`

**Overwrite:**
- `App.jsx` — 14 new routes added
- `pages/Login.jsx` — centered card, gradient background, validation
- `pages/AdminDashboard.jsx` — stat cards, two charts, fee collection,
  section fill, probation, feedback overview
- `pages/StudentDashboard.jsx` — uses Layout, shows enrollments,
  credit load, upcoming exams, latest announcements
- `pages/InstructorDashboard.jsx` — uses Layout, stats, sections table,
  inline roster + attendance form, feedback breakdown
- `pages/EnrollmentPage.jsx` — search + filter + waitlist support, drop button
- `pages/FeePayment.jsx` — uses Layout, proper radio selection, balance checks

**No new npm packages.** Nothing installed — pure React, React Router,
axios, jwt-decode.

## Step 4 — Verify

1. Start the backend: `npm run dev` in `backend/`
2. Start the frontend: `npm run dev` in `frontend/`
3. Login as `ali.ahmad@stu.ums.edu.pk / Admin@123`
4. Expect: sidebar with Dashboard / Announcements / Notifications / Enrollment /
   Timetable / Exam Schedule / Transcript / Course Feedback / Fee Payment.
5. Bell icon in topbar should show a red badge (seed includes welcome
   notification for every user).
6. On Enrollment page, try enrolling in a section that is at capacity —
   should prompt to join the waitlist.
7. Login as `admin@ums.edu.pk / Admin@123`.
8. Expect: full dashboard with stat cards, SVG charts, probation list,
   feedback overview, section fill rates.

## New endpoints summary

| Method | Route | Notes |
|--------|-------|-------|
| GET    | `/api/v1/announcements` | Audience-filtered per user |
| POST   | `/api/v1/announcements` | Admin/Instructor. Fans out notifications |
| DELETE | `/api/v1/announcements/:id` | Poster or Admin |
| GET    | `/api/v1/notifications` | My notifications |
| GET    | `/api/v1/notifications/unread-count` | For bell badge |
| PATCH  | `/api/v1/notifications/:id/read` | |
| PATCH  | `/api/v1/notifications/read-all` | |
| DELETE | `/api/v1/notifications/:id` | |
| GET    | `/api/v1/semesters` | All semesters |
| GET    | `/api/v1/semesters/active` | Currently-Active semester |
| POST   | `/api/v1/semesters` | Admin |
| PATCH  | `/api/v1/semesters/:id/status` | Admin. Enforces single-Active |
| DELETE | `/api/v1/semesters/:id` | Admin |
| POST   | `/api/v1/feedback` | Student. Completed enrollments only |
| GET    | `/api/v1/feedback/pending` | Student |
| GET    | `/api/v1/feedback/instructor/:id/summary` | Instructor/Admin. Aggregate only |
| POST   | `/api/v1/exams` | Instructor/Admin. Notifies enrolled |
| GET    | `/api/v1/exams/my` | Student — upcoming exams |
| GET    | `/api/v1/exams/section/:id` | Any |
| PUT    | `/api/v1/exams/:id` | Instructor/Admin |
| DELETE | `/api/v1/exams/:id` | Instructor/Admin |
| POST   | `/api/v1/waitlist` | **ACID** — join waitlist |
| GET    | `/api/v1/waitlist/my` | Student |
| DELETE | `/api/v1/waitlist/:id` | Cancel — re-numbers positions atomically |
| GET    | `/api/v1/waitlist/section/:id` | Admin/Instructor |
| GET    | `/api/v1/timetable/my` | Student or Instructor |
| GET    | `/api/v1/students/me/transcript/pdf` | HTML, print-ready |
| GET    | `/api/v1/admin/probation` | CGPA < 2.0 |
| GET    | `/api/v1/admin/enrollment-trend` | Per-semester counts for chart |
| GET    | `/api/v1/admin/feedback-overview` | All instructors' aggregates |
| GET    | `/api/v1/admin/section-fill` | Fill-rate + waitlist sizes |

## New ACID transactions (beyond the original 6)

7. **Waitlist join** (`POST /waitlist`) — locks the section row, verifies it's
   actually full, checks program-course eligibility, computes position, inserts.
8. **Waitlist cancel** (`DELETE /waitlist/:id`) — locks the row, marks
   Cancelled, decrements every position behind it in the same transaction.
9. **Semester status change** (`PATCH /semesters/:id/status`) — if setting
   Active, demotes any other Active row to Completed in the same transaction so
   there's exactly one Active semester at all times.
10. **Drop + auto-promote** — the existing drop transaction, now paired with
    `trg_after_enrollment_drop_promote` which atomically promotes the top of the
    waitlist and fires a notification row.

## "Complex features" now ticked off the Phase 3 rubric

- Analytics dashboard with charts — AdminDashboard has two SVG charts plus
  progress bars
- Advanced search and filtering — Enrollment page: text search across code,
  name, instructor + term filter + seats filter
- Real-time updates via polling — NotificationBell polls every 30 seconds
- PDF/Excel report generation — Transcript: server renders print-ready HTML,
  browser's Print → Save as PDF produces the file

## What's NOT in this update (deliberate)

- No Tailwind / Material-UI / other CSS frameworks — pure global.css
- No `recharts` — pure SVG components in `BarChart.jsx` and `LineChart.jsx`
- No `pdfkit` / `puppeteer` — transcript uses browser print-to-PDF
- No new database rows in existing tables — migration only adds new ones
