const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Fail fast if the signing secret isn't configured
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in .env file. Server cannot start.');
    process.exit(1);
}

// Triggers the connection-pool self-test on load
require('./config/db');

// Route modules
const authRoutes         = require('./routes/authRoutes');
const courseRoutes       = require('./routes/courseRoutes');
const feeRoutes          = require('./routes/feeRoutes');
const enrollmentRoutes   = require('./routes/enrollmentRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const assignmentRoutes   = require('./routes/assignmentRoutes');
const submissionRoutes   = require('./routes/submissionRoutes');
const gradeRoutes        = require('./routes/gradeRoutes');
const bookRoutes         = require('./routes/bookRoutes');
const bookIssueRoutes    = require('./routes/bookIssueRoutes');
const adminRoutes        = require('./routes/adminRoutes');
const hostelRoutes       = require('./routes/hostelRoutes');
const instructorRoutes   = require('./routes/instructorRoutes');
const studentRoutes      = require('./routes/studentRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Swagger UI
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'University Management System API is running!' });
});

// All API routes under /api/v1
app.use('/api/v1/auth',        authRoutes);
app.use('/api/v1/courses',     courseRoutes);
app.use('/api/v1/fees',        feeRoutes);
app.use('/api/v1/enrollment',  enrollmentRoutes);
app.use('/api/v1/attendance',  attendanceRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/grades',      gradeRoutes);
app.use('/api/v1/books',       bookRoutes);
app.use('/api/v1/book-issues', bookIssueRoutes);
app.use('/api/v1/admin',       adminRoutes);
app.use('/api/v1/hostels',     hostelRoutes);
app.use('/api/v1/instructors', instructorRoutes);
app.use('/api/v1/students',    studentRoutes);

// Catch-all error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.message);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
