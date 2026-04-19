const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const SALT_ROUNDS = 12;
const ALLOWED_ROLES = ['Admin', 'Instructor', 'Student', 'Librarian'];

const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        // Password strength check
        if (password.length < 8) {
            return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters.' });
        }

        // Role whitelist — default to Student if not provided or invalid
        const assignedRole = (role && ALLOWED_ROLES.includes(role)) ? role : 'Student';

        // Only an existing Admin can create Admin/Instructor/Librarian accounts
        if (['Admin', 'Instructor', 'Librarian'].includes(assignedRole)) {
            if (!req.user || req.user.role !== 'Admin') {
                return res.status(403).json({ 
                    status: 'error', 
                    message: 'Only an Admin can create Admin, Instructor, or Librarian accounts.' 
                });
            }
        }

        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ status: 'error', message: 'User already exists.' });
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, password_hash, assignedRole]
        );

        res.status(201).json({ 
            status: 'success', 
            message: 'User registered successfully.',
            userId: result.insertId,
            role: assignedRole
        });

    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Server error during registration.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
        }
        
        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ status: 'error', message: 'Account is deactivated.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role, linked_id: user.linked_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // Update last_login
        await db.execute('UPDATE users SET last_login = NOW() WHERE user_id = ?', [user.user_id]);

        res.status(200).json({
            status: 'success',
            message: 'Logged in successfully.',
            token,
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role,
                linked_id: user.linked_id
            }
        });

    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ status: 'error', message: 'Server error during login.' });
    }
};

module.exports = { register, login };
