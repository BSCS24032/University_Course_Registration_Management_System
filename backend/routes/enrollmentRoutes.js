const express = require('express');
const router = express.Router();
const { enrollStudent, dropEnrollment, getMyEnrollments } = require('../controllers/enrollmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Admin', 'Student'), enrollStudent);
router.get('/my', authenticateToken, authorizeRoles('Student'), getMyEnrollments);
router.patch('/:enrollment_id/drop', authenticateToken, authorizeRoles('Admin', 'Student'), dropEnrollment);

module.exports = router;
