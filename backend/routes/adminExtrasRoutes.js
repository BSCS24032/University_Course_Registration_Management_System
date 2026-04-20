const express = require('express');
const router = express.Router();
const extras = require('../controllers/adminExtrasController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('Admin'));

router.get('/probation',          extras.getProbationList);
router.get('/enrollment-trend',   extras.getEnrollmentTrend);
router.get('/feedback-overview',  extras.getFeedbackOverview);
router.get('/section-fill',       extras.getSectionFillRates);

module.exports = router;
