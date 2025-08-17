const mongoose = require('mongoose');

const surpriseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['message', 'compliment', 'memory', 'activity'],
    default: 'message'
  },
  scheduleType: {
    type: String,
    required: true,
    enum: ['immediate', 'scheduled'],
    default: 'immediate'
  },
  scheduleTime: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
surpriseSchema.index({ userId: 1, delivered: 1 });
surpriseSchema.index({ userId: 1, scheduleTime: 1 });

module.exports = mongoose.model('Surprise', surpriseSchema);