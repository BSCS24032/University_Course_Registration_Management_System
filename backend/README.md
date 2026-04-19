# University Management System — Backend API (Phase 2)

A RESTful API for a University Management System built with Node.js, Express.js, and MySQL. Implements JWT-based authentication, role-based access control (RBAC) for 4 roles, and ACID-compliant database transactions using raw parameterized SQL.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (v18+) |
| Framework | Express.js 5 |
| Database | MySQL 8.0+ (InnoDB) |
| DB Driver | mysql2/promise (connection pooling) |
| Authentication | JSON Web Tokens (jsonwebtoken) |
| Password Hashing | bcrypt (12 salt rounds) |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Queries | Raw parameterized SQL — no ORM |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) v8.0 or higher
- Git

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/BSCS24032/University_Course_Registration_Management_System.git
cd University_Course_Registration_Management_System
```

### 2. Set up the database

Open a MySQL client (MySQL Workbench, CLI, etc.) and run the schema and seed files:

```bash
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
```

This creates the `university_management_system` database with 18 tables (17 domain + 1 users) and 279 seed records including 4 test user accounts.

### 3. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your local MySQL credentials:

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=university_management_system
JWT_SECRET=your_secret_key_here
```

### 4. Install dependencies and start

```bash
npm install
npm run dev     # development mode with auto-reload (nodemon)
# or
npm start       # production mode
```

You should see:
```
Database connected successfully via Connection Pool!
Server is running on port 5000
```

### 5. Verify

- Health check: `GET http://localhost:5000/api/v1/health`
- Swagger docs: `http://localhost:5000/api-docs`

---

## Seed User Accounts

All seed accounts use password: `Admin@123`

| Email | Role | linked_id |
|---|---|---|
| admin@ums.edu.pk | Admin | — |
| ahmed.khan@ums.edu.pk | Instructor | 1 (instructor_id) |
| ali.ahmad@stu.ums.edu.pk | Student | 1 (student_id) |
| librarian@ums.edu.pk | Librarian | — |

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Optional (Admin token for elevated roles) | Register a new user (defaults to Student) |
| POST | `/api/v1/auth/login` | None | Login and receive JWT token |

### Courses & Sections
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/courses` | Token | List all courses |
| GET | `/api/v1/courses/sections` | Token | List all sections with course info |

### Enrollment (ACID Transaction #1)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/enrollment` | Token + Admin/Student | Enroll in a section (with prerequisite check) |

### Fee Payment (ACID Transaction #2)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/fees/my-fees` | Token + Student | View own fee records |
| POST | `/api/v1/fees/pay` | Token + Admin/Student | Process a fee payment |

### Attendance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/attendance` | Token + Instructor | Mark attendance for a section |
| GET | `/api/v1/attendance/my-records` | Token + Student | View own attendance history |

### Admin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/dashboard` | Token + Admin | Admin dashboard |

---

## ACID Transactions

### Transaction 1: Course Enrollment
1. `BEGIN TRANSACTION`
2. `SELECT ... FOR UPDATE` — lock section row
3. Check capacity not exceeded
4. Check no duplicate enrollment
5. Verify all prerequisites completed
6. `INSERT INTO enrollment` — trigger auto-increments enrolled_count
7. `COMMIT` (or `ROLLBACK` on any failure)

### Transaction 2: Fee Payment
1. `BEGIN TRANSACTION`
2. `SELECT ... FOR UPDATE` — lock fee row
3. Validate fee exists and is not already paid
4. Calculate new amount using integer arithmetic (avoids float bugs)
5. Prevent overpayment
6. `UPDATE fee` with new paid_amount and status
7. `COMMIT` (or `ROLLBACK` on any failure)

Both transactions use `getConnection()` → `beginTransaction()` → `try/catch/finally` → `release()` pattern with proper rollback and connection cleanup.

---

## RBAC (Role-Based Access Control)

4 roles enforced via JWT middleware:

| Role | Permissions |
|---|---|
| **Admin** | Full access, create elevated user accounts, pay any fee |
| **Instructor** | Mark attendance for sections |
| **Student** | Enroll in courses (own only), pay own fees, view own attendance |
| **Librarian** | Manage book issues (endpoints planned) |

---

## Project Structure

```
backend/
├── config/
│   └── db.js                  — MySQL connection pool (exits on failure)
├── controllers/
│   ├── authController.js      — Register (with role whitelist), Login
│   ├── courseController.js     — List courses and sections
│   ├── enrollmentController.js — ACID enrollment transaction
│   ├── feeController.js       — ACID fee payment transaction
│   └── attendanceController.js — Mark and view attendance
├── middleware/
│   └── authMiddleware.js      — authenticateToken, authorizeRoles, optionalAuth
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── enrollmentRoutes.js
│   ├── feeRoutes.js
│   └── attendanceRoutes.js
├── .env.example
├── .gitignore
├── package.json
├── server.js                  — Express app entry point
├── swagger.yaml               — OpenAPI 3.0 specification
└── test.http                  — REST Client test requests
```

---

## Frontend

A React + Vite frontend is included in the `/frontend` directory. To run it:

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Includes Login, Student Dashboard (enrollment, fees, attendance), Instructor Dashboard (mark attendance), and Admin Dashboard.

---

## Database

- **18 tables** (17 domain + users), fully normalized to 3NF
- **5 triggers** (prerequisite validation, enrollment count, book inventory)
- **3 views** (transcript, section roster, fee summary)
- **18 custom indexes** for query performance
- **275+ seed records** across all tables
- Isolation level: `REPEATABLE READ` (InnoDB default)

See `schema.sql`, `seed.sql`, and `performance.sql` for full details.
