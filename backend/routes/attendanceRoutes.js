const express = require('express');
const router = express.Router();


const attendanceController = require('../controllers/attendanceController'); 

const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Instructor'), attendanceController.markAttendance);
router.get('/my-records', authenticateToken, authorizeRoles('Student'), attendanceController.getMyAttendance);

module.exports = router;