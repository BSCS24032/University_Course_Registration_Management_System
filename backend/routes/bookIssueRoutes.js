const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookIssueController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.issueBook);
router.patch('/:issue_id/return', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.returnBook);
router.get('/', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.listIssues);
router.get('/my', authenticateToken, authorizeRoles('Student'), ctrl.getMyIssues);

module.exports = router;
