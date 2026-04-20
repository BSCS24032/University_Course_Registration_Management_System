const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gradeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Assign one grade to one enrollment
router.post('/assign', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.assignGrade);

// Bulk-assign grades for a whole section using cutoff thresholds
router.post('/apply-threshold', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.applyThresholds);

// Averages + grade sheet
router.get('/sections/:section_id/average', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getSectionAverage);
router.get('/sections/:section_id/grade-sheet', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getGradeSheet);
router.get('/courses/:course_id/average', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getCourseAverage);

module.exports = router;
