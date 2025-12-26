const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Authorization required.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request object
    req.user = {
      id: decoded.id,
      role: decoded.role || 'client' // Default to client if role is missing in legacy tokens
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }

    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Role guards
const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
  }
  next();
};

const requireClient = requireRole(['client']);
const requireTrainer = requireRole(['trainer']);
const requireGymOwner = requireRole(['gym_owner']);

module.exports = { authMiddleware, requireRole, requireClient, requireTrainer, requireGymOwner };
