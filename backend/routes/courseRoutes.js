const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, ctrl.getAllCourses);
router.get('/sections', authenticateToken, ctrl.getAllSections);
router.get('/eligible', authenticateToken, authorizeRoles('Student'), ctrl.getMyEligibleCourses);
router.get('/:course_id/prerequisites', authenticateToken, ctrl.getCoursePrerequisites);

module.exports = router;
