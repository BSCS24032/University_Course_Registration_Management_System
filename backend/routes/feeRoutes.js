const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Student views their own fee records
router.get('/my-fees', authenticateToken, authorizeRoles('Student'), feeController.getMyFees);

// Student or Admin processes a payment
router.post('/pay', authenticateToken, authorizeRoles('Admin', 'Student'), feeController.processFeePayment);

module.exports = router;
