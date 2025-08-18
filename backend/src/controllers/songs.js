/* eslint-env node */
const Song = require('../models/Song');
const User = require('../models/User');

// Get all songs for user and partner
exports.getSongs = async (req, res) => {
  try {
    // Demo mode: if no user authentication, return all songs
    if (!req.user) {
      const songs = await Song.find({})
        .sort({ createdAt: -1 })
        .populate('userId', 'username profile.name profile.gender');
      return res.json(songs);
    }

    // Get user and their partner
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find songs for user and partner
    let userIds = [user._id];
    if (user.partnerId) {
      userIds.push(user.partnerId);
    }

    const songs = await Song.find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .populate('userId', 'username profile.name profile.gender');

    res.json(songs);
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({
      message: 'Server error while fetching songs',
      error: error.message
    });
  }
};

// Add new song
exports.addSong = async (req, res) => {
  try {
    const { title, artist, story, url, user } = req.body;

    // Validate input
    if (!title || !artist) {
      return res.status(400).json({ message: 'Title and artist are required' });
    }

    // Demo mode: create or find demo user based on gender
    let userId = null;
    if (user && ['female', 'male', 'other'].includes(user)) {
      // Try to find existing demo user with this gender
      let demoUser = await User.findOne({ 
        username: `demo-${user}`,
        'profile.gender': user 
      });
      
      // If not found, create a new demo user
      if (!demoUser) {
        demoUser = new User({
          username: `demo-${user}`,
          email: `demo-${user}@example.com`,
          password: 'demo123', // This will be hashed automatically
          profile: {
            name: user === 'female' ? 'Demo Kadın' : user === 'male' ? 'Demo Erkek' : 'Demo Kullanıcı',
            gender: user
          }
        });
        await demoUser.save();
      }
      
      userId = demoUser._id;
    }

    // Create song
    const newSong = new Song({
      userId: userId,
      title,
      artist,
      story,
      url
    });

    await newSong.save();

    // Populate user info if userId exists
    if (userId) {
      await newSong.populate('userId', 'username profile.name profile.gender');
    }

    res.status(201).json(newSong);
  } catch (error) {
    console.error('Add song error:', error);
    res.status(500).json({
      message: 'Server error while adding song',
      error: error.message
    });
  }
};

// Update song
exports.updateSong = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, story, url } = req.body;

    // Find song
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Demo mode: skip authorization check if no user authentication
    if (req.user) {
      // Check if user owns this song
      if (song.userId && song.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this song' });
      }
    }

    // Update song
    song.title = title || song.title;
    song.artist = artist || song.artist;
    song.story = story || song.story;
    song.url = url || song.url;

    await song.save();

    // Populate user info if userId exists
    if (song.userId) {
      await song.populate('userId', 'username profile.name profile.gender');
    }

    res.json(song);
  } catch (error) {
    console.error('Update song error:', error);
    res.status(500).json({
      message: 'Server error while updating song',
      error: error.message
    });
  }
};

// Delete song
exports.deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    // Find song
    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Demo mode: skip authorization check if no user authentication
    if (req.user) {
      // Check if user owns this song
      if (song.userId && song.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to delete this song' });
      }
    }

    // Delete song
    await Song.findByIdAndDelete(id);

    res.json({ message: 'Song deleted successfully' });
  } catch (error) {
    console.error('Delete song error:', error);
    res.status(500).json({
      message: 'Server error while deleting song',
      error: error.message
    });
  }
};