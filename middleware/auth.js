const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware.
 * Login returns a JWT; the token is optional here: when a Bearer token is sent it
 * MUST be valid (otherwise 401), and the logged-in user is attached to req.user.
 * The assignment reads the logged-in user id from the query params, so the
 * endpoints keep working with ?id=... as specified.
 */
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'assignment8_sticky_notes_secret');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Not authorized, user no longer exists' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};
