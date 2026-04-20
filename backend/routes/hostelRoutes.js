const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/hostelController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRoles('Admin'), ctrl.listHostels);
router.get('/rooms', authenticateToken, authorizeRoles('Admin'), ctrl.listRooms);
router.get('/allocations', authenticateToken, authorizeRoles('Admin'), ctrl.listAllocations);
router.post('/allocations', authenticateToken, authorizeRoles('Admin'), ctrl.allocateRoom);
router.patch('/allocations/:allocation_id/vacate', authenticateToken, authorizeRoles('Admin'), ctrl.vacateRoom);

module.exports = router;
