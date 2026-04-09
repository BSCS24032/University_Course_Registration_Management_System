# University Management System API - Phase 2

This repository contains the backend API for the University Management System, developed for Phase 2 of the Advanced Database Management course. It implements a RESTful API with strict security, role-based access control (RBAC), and ACID-compliant database transactions.

## 🚀 Technology Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MySQL (using `mysql2` with Connection Pooling)
* **Authentication:** JSON Web Tokens (JWT) & bcrypt hashing
* **Documentation:** Swagger UI (OpenAPI 3.0)
* **Database Queries:** Raw parameterized SQL queries (No ORMs used for critical operations).

## 📋 Prerequisites
Before running this project, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0 or higher)

## 🛠️ Setup and Run Instructions

Follow these steps to get the backend server running locally:

### 1. Install Dependencies
Open your terminal, navigate to the `backend/` directory, and run:
```bash
npm install