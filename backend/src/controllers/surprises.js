const Surprise = require('../models/Surprise');
const User = require('../models/User');

// Get all surprises for user and partner
exports.getSurprises = async (req, res) => {
  try {
    // Get user and their partner
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find surprises for user and partner
    let userIds = [user._id];
    if (user.partnerId) {
      userIds.push(user.partnerId);
    }

    const surprises = await Surprise.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profile.name profile.gender');

    res.json(surprises);
  } catch (error) {
    console.error('Get surprises error:', error);
    res.status(500).json({
      message: 'Server error while fetching surprises',
      error: error.message
    });
  }
};

// Create new surprise
exports.createSurprise = async (req, res) => {
  try {
    const { message, type, scheduleType, scheduleTime } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Create surprise
    const newSurprise = new Surprise({
      userId: req.user._id,
      message,
      type,
      scheduleType,
      scheduleTime,
      delivered: scheduleType === 'immediate'
    });

    await newSurprise.save();

    // Populate user info
    await newSurprise.populate('userId', 'username profile.name profile.gender');

    res.status(201).json(newSurprise);
  } catch (error) {
    console.error('Create surprise error:', error);
    res.status(500).json({
      message: 'Server error while creating surprise',
      error: error.message
    });
  }
};

// Update surprise
exports.updateSurprise = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, type, scheduleType, scheduleTime, delivered } = req.body;

    // Find surprise
    const surprise = await Surprise.findById(id);
    if (!surprise) {
      return res.status(404).json({ message: 'Surprise not found' });
    }

    // Check if user owns this surprise
    if (surprise.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this surprise' });
    }

    // Update surprise
    surprise.message = message || surprise.message;
    surprise.type = type || surprise.type;
    surprise.scheduleType = scheduleType || surprise.scheduleType;
    surprise.scheduleTime = scheduleTime || surprise.scheduleTime;
    if (delivered !== undefined) {
      surprise.delivered = delivered;
    }

    await surprise.save();

    // Populate user info
    await surprise.populate('userId', 'username profile.name profile.gender');

    res.json(surprise);
  } catch (error) {
    console.error('Update surprise error:', error);
    res.status(500).json({
      message: 'Server error while updating surprise',
      error: error.message
    });
  }
};

// Delete surprise
exports.deleteSurprise = async (req, res) => {
  try {
    const { id } = req.params;

    // Find surprise
    const surprise = await Surprise.findById(id);
    if (!surprise) {
      return res.status(404).json({ message: 'Surprise not found' });
    }

    // Check if user owns this surprise
    if (surprise.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this surprise' });
    }

    // Delete surprise
    await Surprise.findByIdAndDelete(id);

    res.json({ message: 'Surprise deleted successfully' });
  } catch (error) {
    console.error('Delete surprise error:', error);
    res.status(500).json({
      message: 'Server error while deleting surprise',
      error: error.message
    });
  }
};