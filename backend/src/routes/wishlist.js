const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');
// const auth = require('../middleware/auth'); // Removed for demo mode

// All routes are now public for demo mode
// router.use(auth); // Disabled authentication

// Get all wishlist items for user and partner
router.get('/', wishlistController.getWishlistItems);

// Create new wishlist item
router.post('/', wishlistController.createWishlistItem);

// Update wishlist item
router.put('/:id', wishlistController.updateWishlistItem);

// Delete wishlist item
router.delete('/:id', wishlistController.deleteWishlistItem);

module.exports = router;