const Wishlist = require('../models/Wishlist');
const User = require('../models/User');

// Get all wishlist items
exports.getWishlistItems = async (req, res) => {
  try {
    // Find all wishlist items
    const wishlistItems = await Wishlist.find({})
      .sort({ createdAt: -1 });
    
    // Add logging to see what data is being returned
    console.log('Wishlist items fetched:', wishlistItems.map(item => ({
      id: item._id,
      title: item.title,
      gender: item.gender
    })));

    res.json(wishlistItems);
  } catch (error) {
    console.error('Get wishlist items error:', error);
    res.status(500).json({
      message: 'Server error while fetching wishlist items',
      error: error.message
    });
  }
};

// Create new wishlist item
exports.createWishlistItem = async (req, res) => {
  try {
    const { title, category, description, priority, gender } = req.body;

    // Validate input
    if (!title || !category || !gender) {
      return res.status(400).json({ message: 'Title, category and gender are required' });
    }

    // Create wishlist item
    const newWishlistItem = new Wishlist({
      gender,
      title,
      category,
      description,
      priority
    });

    await newWishlistItem.save();
    
    // Add logging to see what data is being returned
    console.log('New wishlist item created:', {
      id: newWishlistItem._id,
      title: newWishlistItem.title,
      gender: newWishlistItem.gender
    });

    res.status(201).json(newWishlistItem);
  } catch (error) {
    console.error('Create wishlist item error:', error);
    res.status(500).json({
      message: 'Server error while creating wishlist item',
      error: error.message
    });
  }
};

// Update wishlist item
exports.updateWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, description, priority, completed, gender } = req.body;

    // Find wishlist item
    const wishlistItem = await Wishlist.findById(id);
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    // Update wishlist item
    wishlistItem.title = title || wishlistItem.title;
    wishlistItem.category = category || wishlistItem.category;
    wishlistItem.description = description || wishlistItem.description;
    wishlistItem.priority = priority || wishlistItem.priority;
    wishlistItem.gender = gender || wishlistItem.gender;
    if (completed !== undefined) {
      wishlistItem.completed = completed;
    }

    await wishlistItem.save();
    
    // Add logging to see what data is being returned
    console.log('Wishlist item updated:', {
      id: wishlistItem._id,
      title: wishlistItem.title,
      gender: wishlistItem.gender
    });

    res.json(wishlistItem);
  } catch (error) {
    console.error('Update wishlist item error:', error);
    res.status(500).json({
      message: 'Server error while updating wishlist item',
      error: error.message
    });
  }
};

// Delete wishlist item
exports.deleteWishlistItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Find wishlist item
    const wishlistItem = await Wishlist.findById(id);
    if (!wishlistItem) {
      return res.status(404).json({ message: 'Wishlist item not found' });
    }

    // Delete wishlist item
    await Wishlist.findByIdAndDelete(id);

    res.json({ message: 'Wishlist item deleted successfully' });
  } catch (error) {
    console.error('Delete wishlist item error:', error);
    res.status(500).json({
      message: 'Server error while deleting wishlist item',
      error: error.message
    });
  }
};