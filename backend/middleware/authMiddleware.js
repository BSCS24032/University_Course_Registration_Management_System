const jwt = require('jsonwebtoken');

// 1. Require a valid token — returns 401 if missing/invalid
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        // 401 = not authenticated (invalid/expired token)
        res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
    }
};

// 2. Check if the user has the right role — returns 403 if wrong role
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }
        next();
    };
};

// 3. Optional auth — if a token is present, decode it; if not, continue without user
//    Used for endpoints like /register where a token is optional (admin creating users)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token present but invalid — ignore it, treat as unauthenticated
            req.user = null;
        }
    }
    next();
};

module.exports = { authenticateToken, authorizeRoles, optionalAuth };
