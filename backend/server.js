const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Validate critical environment variables before starting
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in .env file. Server cannot start.');
    process.exit(1);
}

// Import DB pool (triggers connection test on load)
require('./config/db');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const feeRoutes = require('./routes/feeRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Swagger API Documentation
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health Check
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'University Management System API is running!' 
    });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/enrollment', enrollmentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// Admin dashboard (moved from inline, will be its own route file when more admin endpoints are added)
app.get('/api/v1/admin/dashboard', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to the Admin Dashboard!' });
});

// Global error handler — catches unhandled errors in routes
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.message);
    res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
