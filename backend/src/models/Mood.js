/* eslint-env node */
const mongoose = require('mongoose');

const moodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for demo mode
  },
  mood: {
    type: String,
    required: [true, 'Mood is required'],
    enum: ['happy', 'sad', 'angry', 'excited', 'tired', 'calm', 'anxious', 'grateful'],
    trim: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
moodSchema.index({ userId: 1, createdAt: -1 });
moodSchema.index({ gender: 1, createdAt: -1 });

module.exports = mongoose.model('Mood', moodSchema);
/* eslint-enable */