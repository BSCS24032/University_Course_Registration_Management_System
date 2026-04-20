const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/examController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',   authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.createExam);
router.get('/my',  authenticateToken, authorizeRoles('Student'), ctrl.getMyExams);
router.get('/section/:section_id', authenticateToken, ctrl.getSectionExams);
router.put('/:id', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.updateExam);
router.delete('/:id', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.deleteExam);

module.exports = router;
