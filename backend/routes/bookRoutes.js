const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Browse the catalogue — any authenticated user
router.get('/', authenticateToken, ctrl.getAllBooks);
router.get('/:book_id', authenticateToken, ctrl.getBookById);

// Catalogue management — Librarian/Admin only
router.post('/', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.createBook);
router.put('/:book_id', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.updateBook);
router.delete('/:book_id', authenticateToken, authorizeRoles('Librarian', 'Admin'), ctrl.deleteBook);

module.exports = router;
