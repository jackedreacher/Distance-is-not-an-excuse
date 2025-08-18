const express = require('express');
const router = express.Router();
const songController = require('../controllers/songs');
// const auth = require('../middleware/auth'); // Removed for demo mode

// All routes are now public for demo mode
// router.use(auth); // Disabled authentication

// Get all songs for user and partner
router.get('/', songController.getSongs);

// Add new song
router.post('/', songController.addSong);

// Update song
router.put('/:id', songController.updateSong);

// Delete song
router.delete('/:id', songController.deleteSong);

module.exports = router;