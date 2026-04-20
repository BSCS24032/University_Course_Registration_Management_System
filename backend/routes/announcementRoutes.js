const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/announcementController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/',  authenticateToken, ctrl.listAnnouncements);
router.post('/', authenticateToken, authorizeRoles('Admin', 'Instructor'), ctrl.createAnnouncement);
router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'Instructor'), ctrl.deleteAnnouncement);

module.exports = router;
