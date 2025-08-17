const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['female', 'male'],
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['restaurants', 'travel', 'activities', 'gifts'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
wishlistSchema.index({ gender: 1, category: 1 });
wishlistSchema.index({ gender: 1, priority: 1 });
wishlistSchema.index({ gender: 1, completed: 1 });

// Set completedDate when item is marked as completed
wishlistSchema.pre('save', function(next) {
  if (this.isModified('completed') && this.completed && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Wishlist', wishlistSchema);