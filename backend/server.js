const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in .env file. Server cannot start.');
    process.exit(1);
}

require('./config/db');

// Existing route modules
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

// New route modules (v2)
const semesterRoutes     = require('./routes/semesterRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const feedbackRoutes     = require('./routes/feedbackRoutes');
const examRoutes         = require('./routes/examRoutes');
const waitlistRoutes     = require('./routes/waitlistRoutes');
const timetableRoutes    = require('./routes/timetableRoutes');
const transcriptRoutes   = require('./routes/transcriptRoutes');
const adminExtrasRoutes  = require('./routes/adminExtrasRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'University Management System API is running!' });
});

// Existing
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
app.use('/api/v1/admin',       adminExtrasRoutes);
app.use('/api/v1/hostels',     hostelRoutes);
app.use('/api/v1/instructors', instructorRoutes);
app.use('/api/v1/students',    studentRoutes);

// New in v2 (mount transcript as a second handler under /students so
// GET /students/me/transcript/pdf coexists with existing student routes)
app.use('/api/v1/students',      transcriptRoutes);
app.use('/api/v1/semesters',     semesterRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/feedback',      feedbackRoutes);
app.use('/api/v1/exams',         examRoutes);
app.use('/api/v1/waitlist',      waitlistRoutes);
app.use('/api/v1/timetable',     timetableRoutes);

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.message);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
});
