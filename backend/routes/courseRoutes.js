const express = require('express');
const router = express.Router();
const { getAllCourses, getAllSections } = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getAllCourses);
router.get('/sections', authenticateToken, getAllSections);

module.exports = router;