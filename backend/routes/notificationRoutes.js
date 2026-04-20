const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/',              authenticateToken, ctrl.listMyNotifications);
router.get('/unread-count',  authenticateToken, ctrl.getUnreadCount);
router.patch('/read-all',    authenticateToken, ctrl.markAllRead);
router.patch('/:id/read',    authenticateToken, ctrl.markRead);
router.delete('/:id',        authenticateToken, ctrl.deleteNotification);

module.exports = router;
