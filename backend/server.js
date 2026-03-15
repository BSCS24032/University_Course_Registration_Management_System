const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const courseRoutes = require('./routes/courseRoutes');
const feeRoutes = require('./routes/feeRoutes'); 
const authRoutes = require('./routes/authRoutes');
// Importing this file automatically runs the pool.getConnection() test we wrote!
const db = require('./config/db'); 

const enrollmentRoutes = require('./routes/enrollmentRoutes');


const app = express();

// Middleware
app.use(cors());
// Allow requests from our React frontend
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // Allows our API to read JSON data from requests

// Swagger API Documentation Route
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// A simple Health Check route (Notice the /api/v1/ versioning required by Phase 2)
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'University Management System API is running!' 
    });
});

// Authentication Routes
app.use('/api/v1/auth', authRoutes);

// Course Routes
app.use('/api/v1/courses', courseRoutes);

app.use('/api/v1/fees', feeRoutes); 

// Start the server
const PORT = process.env.PORT || 5000;

const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');
// Enrollment ACID Transaction Route
app.use('/api/v1/enrollment', enrollmentRoutes);

// A route ONLY Admins can see
app.get('/api/v1/admin/dashboard', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to the secret Admin Dashboard!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});