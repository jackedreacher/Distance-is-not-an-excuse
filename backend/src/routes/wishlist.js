const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all wishlist items for user and partner
router.get('/', wishlistController.getWishlistItems);

// Create new wishlist item
router.post('/', wishlistController.createWishlistItem);

// Update wishlist item
router.put('/:id', wishlistController.updateWishlistItem);

// Delete wishlist item
router.delete('/:id', wishlistController.deleteWishlistItem);

module.exports = router;