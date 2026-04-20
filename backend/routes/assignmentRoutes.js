const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.createAssignment);
router.get('/section/:section_id', authenticateToken, ctrl.getSectionAssignments);
router.get('/my', authenticateToken, authorizeRoles('Student'), ctrl.getMyAssignments);
router.delete('/:assignment_id', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.deleteAssignment);

module.exports = router;
