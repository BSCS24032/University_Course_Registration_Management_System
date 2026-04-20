const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/instructorController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/me/sections', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getMySections);
router.get('/sections/:section_id/roster', authenticateToken, authorizeRoles('Instructor', 'Admin'), ctrl.getSectionRoster);

module.exports = router;
