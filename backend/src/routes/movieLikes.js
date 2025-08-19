/* eslint-env node */
const express = require('express');
const router = express.Router();
const movieLikesController = require('../controllers/movieLikes');

// Get all liked movies/TV shows
router.get('/', movieLikesController.getLikedMovies);

// Add movie/TV show to likes
router.post('/', movieLikesController.addLikedMovie);

// Update liked movie (mark as watched, add rating, etc.)
router.put('/:id', movieLikesController.updateLikedMovie);

// Unlike movie/TV show by movieId and type - place BEFORE the dynamic ':id' route to avoid conflicts
router.delete('/unlike', movieLikesController.unlikeMovie);

// Remove movie/TV show from likes by ID
router.delete('/:id', movieLikesController.removeLikedMovie);

module.exports = router;