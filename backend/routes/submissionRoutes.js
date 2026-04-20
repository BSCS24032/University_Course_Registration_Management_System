const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/submissionController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Student'), ctrl.createSubmission);
router.put('/:submission_id/grade', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.gradeSubmission);
router.get('/assignment/:assignment_id', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getAssignmentSubmissions);

module.exports = router;
