const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { optionalAuth } = require('../middleware/authMiddleware');

// optionalAuth: if a token is present, decode it (so req.user is set for admin checks).
// If no token, req.user stays undefined and registration defaults to Student role.
router.post('/register', optionalAuth, register);
router.post('/login', login);

module.exports = router;
