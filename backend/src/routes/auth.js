const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const auth = require('../middleware/auth');

// Register route
router.post('/register', authController.register);

// Login route
router.post('/login', authController.login);

// Logout route
router.post('/logout', authController.logout);

// Get user profile
router.get('/profile', auth, authController.getProfile);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;