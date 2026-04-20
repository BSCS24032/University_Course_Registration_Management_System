const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/me/transcript', authenticateToken, authorizeRoles('Student'), ctrl.getMyTranscript);
router.get('/me/credit-load', authenticateToken, authorizeRoles('Student'), ctrl.getMyCreditLoad);
router.get('/me/profile', authenticateToken, authorizeRoles('Student'), ctrl.getMyProfile);

module.exports = router;
