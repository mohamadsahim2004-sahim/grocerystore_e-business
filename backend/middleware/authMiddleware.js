const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate the user using a JWT.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // No Authorization header
  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }

  // Extract JWT
  const token = authHeader
    .slice(7)
    .trim();

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }

  // JWT secret must exist
  if (!process.env.JWT_SECRET) {
    console.error(
      'JWT_SECRET is not configured'
    );

    return res.status(500).json({
      message:
        'Server authentication configuration error'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Token must contain user ID
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message:
          'Not authorized, invalid token'
      });
    }

    // Find user
    const user = await User.findById(
      decoded.id
    );

    // User must exist and be active
    if (
      !user ||
      user.isActive === false
    ) {
      return res.status(401).json({
        message:
          'Not authorized, user not found or inactive'
      });
    }

    // Attach user to request
    req.user = user;

    // Continue to the next middleware
    return next();

  } catch (error) {

    // Invalid/expired JWT
    if (
      error.name ===
        'JsonWebTokenError' ||
      error.name ===
        'TokenExpiredError' ||
      error.name ===
        'NotBeforeError'
    ) {
      return res.status(401).json({
        message:
          'Not authorized, invalid or expired token'
      });
    }

    console.error(
      'Authentication middleware error:',
      error
    );

    return next(error);
  }
};


// Allow only administrators.
const admin = (
  req,
  res,
  next
) => {

  if (!req.user) {
    return res.status(401).json({
      message:
        'Not authorized, please log in'
    });
  }

  if (
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({
      message:
        'Access denied. Administrator privileges required.'
    });
  }

  return next();
};


module.exports = {
  protect,
  admin
};