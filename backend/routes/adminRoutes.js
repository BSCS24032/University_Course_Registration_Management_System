const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('Admin'));

router.get('/departments', adminController.getDepartments);
router.post('/courses/add', adminController.addCourse);

module.exports = router;