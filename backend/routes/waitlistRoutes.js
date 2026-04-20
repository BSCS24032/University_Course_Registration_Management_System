const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/waitlistController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/',        authenticateToken, authorizeRoles('Student'), ctrl.joinWaitlist);
router.get('/my',       authenticateToken, authorizeRoles('Student'), ctrl.getMyWaitlist);
router.delete('/:id',   authenticateToken, ctrl.cancelWaitlist);
router.get('/section/:id',
    authenticateToken, authorizeRoles('Admin', 'Instructor'), ctrl.getSectionWaitlist);

module.exports = router;
