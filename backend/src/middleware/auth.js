const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Development bypass - skip authentication entirely
  if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
    // Create a mock user for development
    req.user = {
      _id: '68a267a5a9bca31a4430cb29', // Real test user ID
      username: 'testuser',
      email: 'test@example.com',
      profile: {
        name: 'Test User',
        dateOfBirth: new Date('1990-01-01'),
        relationshipStart: new Date('2020-01-01')
      }
    };
    return next();
  }

  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Extract token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;