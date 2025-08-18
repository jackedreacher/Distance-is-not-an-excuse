/* eslint-env node */
const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  artist: {
    type: String,
    required: [true, 'Artist is required'],
    trim: true,
    maxlength: [100, 'Artist name cannot exceed 100 characters']
  },
  story: {
    type: String,
    trim: true,
    maxlength: [1000, 'Story cannot exceed 1000 characters']
  },
  url: {
    type: String,
    trim: true,
    maxlength: [500, 'URL cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
songSchema.index({ userId: 1, title: 1 });
songSchema.index({ userId: 1, artist: 1 });

module.exports = mongoose.model('Song', songSchema);
/* eslint-enable */