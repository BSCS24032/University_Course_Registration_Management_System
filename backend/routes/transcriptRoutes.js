const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transcriptController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/me/transcript/pdf',
    authenticateToken, authorizeRoles('Student', 'Admin'), ctrl.getTranscriptHtml);

module.exports = router;
