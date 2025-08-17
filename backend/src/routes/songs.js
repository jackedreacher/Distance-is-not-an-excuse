const express = require('express');
const router = express.Router();
const songController = require('../controllers/songs');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all songs for user and partner
router.get('/', songController.getSongs);

// Add new song
router.post('/', songController.addSong);

// Update song
router.put('/:id', songController.updateSong);

// Delete song
router.delete('/:id', songController.deleteSong);

module.exports = router;