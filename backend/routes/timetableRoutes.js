const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timetableController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/my', authenticateToken, ctrl.getMyTimetable);

module.exports = router;
