// Authentication Middleware
// Verifies JWT token from Authorization header and protects routes.

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.'
      });
    }

    // Extract token string
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'spendwise_super_secret_jwt_key_2026';

    // Verify token
    const decoded = jwt.verify(token, secret);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.'
    });
  }
};

module.exports = authMiddleware;
