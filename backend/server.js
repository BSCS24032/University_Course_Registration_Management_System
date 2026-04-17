const express = require('express');
const cors = require('cors');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const courseRoutes = require('./routes/courseRoutes');
const feeRoutes = require('./routes/feeRoutes'); 
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

const db = require('./config/db'); 

const app = express();

app.use(cors());
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'University Management System API is running!' 
    });
});

app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/courses', courseRoutes);

app.use('/api/v1/fees', feeRoutes); 

app.use('/api/v1/attendance', attendanceRoutes);

app.use('/api/v1/admin', adminRoutes);

app.use('/api/v1/enrollment', enrollmentRoutes);

const PORT = process.env.PORT || 5000;

const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

app.get('/api/v1/admin/dashboard', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to the secret Admin Dashboard!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});