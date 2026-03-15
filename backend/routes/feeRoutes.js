const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');

// 1. Import the CORRECT names from your middleware file
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// 2. Use 'authenticateToken' instead of 'protect'
router.post('/pay', authenticateToken, feeController.processFeePayment);

module.exports = router;