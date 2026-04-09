const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route to get student's specific fee records
router.get('/my-fees', authenticateToken, authorizeRoles('Student'), feeController.getMyFees);

// Route to process a payment
router.post('/pay', authenticateToken, authorizeRoles('Student'), feeController.processFeePayment);

module.exports = router;