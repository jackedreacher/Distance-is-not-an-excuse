const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moods');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all moods for user and partner
router.get('/', moodController.getMoods);

// Create new mood
router.post('/', moodController.createMood);

// Update mood
router.put('/:id', moodController.updateMood);

// Delete mood
router.delete('/:id', moodController.deleteMood);

module.exports = router;