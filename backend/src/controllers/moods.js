const Mood = require('../models/Mood');
const User = require('../models/User');

// Get all moods for user and partner
exports.getMoods = async (req, res) => {
  try {
    // Get user and their partner
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find moods for user and partner
    let userIds = [user._id];
    if (user.partnerId) {
      userIds.push(user.partnerId);
    }

    const moods = await Mood.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profile.name profile.gender');

    res.json(moods);
  } catch (error) {
    console.error('Get moods error:', error);
    res.status(500).json({
      message: 'Server error while fetching moods',
      error: error.message
    });
  }
};

// Create new mood
exports.createMood = async (req, res) => {
  try {
    const { mood, message, gender } = req.body;

    // Validate input
    if (!mood) {
      return res.status(400).json({ message: 'Mood is required' });
    }

    // Create mood
    const newMood = new Mood({
      userId: req.user._id,
      mood,
      message,
      gender
    });

    await newMood.save();

    // Populate user info
    await newMood.populate('userId', 'username profile.name profile.gender');

    res.status(201).json(newMood);
  } catch (error) {
    console.error('Create mood error:', error);
    res.status(500).json({
      message: 'Server error while creating mood',
      error: error.message
    });
  }
};

// Update mood
exports.updateMood = async (req, res) => {
  try {
    const { id } = req.params;
    const { mood, message } = req.body;

    // Find mood
    const moodDoc = await Mood.findById(id);
    if (!moodDoc) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    // Check if user owns this mood
    if (moodDoc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this mood' });
    }

    // Update mood
    moodDoc.mood = mood || moodDoc.mood;
    moodDoc.message = message || moodDoc.message;

    await moodDoc.save();

    // Populate user info
    await moodDoc.populate('userId', 'username profile.name profile.gender');

    res.json(moodDoc);
  } catch (error) {
    console.error('Update mood error:', error);
    res.status(500).json({
      message: 'Server error while updating mood',
      error: error.message
    });
  }
};

// Delete mood
exports.deleteMood = async (req, res) => {
  try {
    const { id } = req.params;

    // Find mood
    const moodDoc = await Mood.findById(id);
    if (!moodDoc) {
      return res.status(404).json({ message: 'Mood not found' });
    }

    // Check if user owns this mood
    if (moodDoc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this mood' });
    }

    // Delete mood
    await Mood.findByIdAndDelete(id);

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    console.error('Delete mood error:', error);
    res.status(500).json({
      message: 'Server error while deleting mood',
      error: error.message
    });
  }
};