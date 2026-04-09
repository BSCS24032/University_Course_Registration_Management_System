const express = require('express');
const router = express.Router();
const { enrollStudent } = require('../controllers/enrollmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Admin', 'Student'), enrollStudent);

module.exports = router;