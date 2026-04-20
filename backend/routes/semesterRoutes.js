const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/semesterController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/',        authenticateToken, ctrl.listSemesters);
router.get('/active',  authenticateToken, ctrl.getActiveSemester);
router.post('/',       authenticateToken, authorizeRoles('Admin'), ctrl.createSemester);
router.patch('/:id/status', authenticateToken, authorizeRoles('Admin'), ctrl.setSemesterStatus);
router.delete('/:id',  authenticateToken, authorizeRoles('Admin'), ctrl.deleteSemester);

module.exports = router;
