const mongoose = require('mongoose');

const movieLikeSchema = new mongoose.Schema({
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['female', 'male'],
    trim: true
  },
  movieId: {
    type: Number,
    required: [true, 'Movie/TV show ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['movie', 'tv'],
    trim: true
  },
  posterPath: {
    type: String,
    trim: true
  },
  overview: {
    type: String,
    trim: true,
    maxlength: [1000, 'Overview cannot exceed 1000 characters']
  },
  releaseDate: {
    type: String,
    trim: true
  },
  voteAverage: {
    type: Number,
    min: 0,
    max: 10
  },
  genres: [{
    id: Number,
    name: String
  }],
  originalTitle: {
    type: String,
    trim: true
  },
  originalLanguage: {
    type: String,
    trim: true
  },
  watched: {
    type: Boolean,
    default: false
  },
  watchedDate: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for better query performance
movieLikeSchema.index({ gender: 1, type: 1 });
movieLikeSchema.index({ gender: 1, watched: 1 });
movieLikeSchema.index({ movieId: 1, type: 1 }, { unique: true });
movieLikeSchema.index({ createdAt: -1 });

// Pre-save middleware
movieLikeSchema.pre('save', function(next) {
  if (this.watched && !this.watchedDate) {
    this.watchedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('MovieLike', movieLikeSchema);