const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedbackController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',         authenticateToken, authorizeRoles('Student'), ctrl.submitFeedback);
router.get('/pending',   authenticateToken, authorizeRoles('Student'), ctrl.getPendingFeedback);
router.get('/instructor/:id/summary',
    authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getInstructorSummary);

module.exports = router;
