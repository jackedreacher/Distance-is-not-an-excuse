const MovieLike = require('../models/MovieLike');

// Get all liked movies/TV shows
exports.getLikedMovies = async (req, res) => {
  try {
    const { gender, type, watched } = req.query;
    
    // Build filter object
    const filter = {};
    if (gender) filter.gender = gender;
    if (type) filter.type = type;
    if (watched !== undefined) filter.watched = watched === 'true';
    
    const likedMovies = await MovieLike.find(filter)
      .sort({ createdAt: -1 });
    
    console.log('Liked movies fetched:', likedMovies.length);
    res.json(likedMovies);
  } catch (error) {
    console.error('Get liked movies error:', error);
    res.status(500).json({
      message: 'Server error while fetching liked movies',
      error: error.message
    });
  }
};

// Add movie/TV show to likes
exports.addLikedMovie = async (req, res) => {
  try {
    const { 
      gender, 
      movieId, 
      title, 
      type, 
      posterPath, 
      overview, 
      releaseDate, 
      voteAverage, 
      genres, 
      originalTitle, 
      originalLanguage 
    } = req.body;

    // Validate required fields
    if (!gender || !movieId || !title || !type) {
      return res.status(400).json({ 
        message: 'Gender, movieId, title, and type are required' 
      });
    }

    // Convert movieId to Number to match schema
    const numericMovieId = Number(movieId);
    if (isNaN(numericMovieId)) {
      return res.status(400).json({ 
        message: 'MovieId must be a valid number' 
      });
    }

    // Check if already liked
    const existingLike = await MovieLike.findOne({ movieId: numericMovieId, type });
    if (existingLike) {
      return res.status(409).json({ 
        message: 'This movie/TV show is already in your liked list' 
      });
    }

    // Create new liked movie
    const newLikedMovie = new MovieLike({
      gender,
      movieId: numericMovieId,
      title,
      type,
      posterPath,
      overview,
      releaseDate,
      voteAverage,
      genres,
      originalTitle,
      originalLanguage
    });

    await newLikedMovie.save();
    
    console.log('New liked movie added:', {
      id: newLikedMovie._id,
      title: newLikedMovie.title,
      type: newLikedMovie.type
    });

    res.status(201).json(newLikedMovie);
  } catch (error) {
    console.error('Add liked movie error:', error);
    res.status(500).json({
      message: 'Server error while adding liked movie',
      error: error.message
    });
  }
};

// Update liked movie (mark as watched, add rating, etc.)
exports.updateLikedMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedMovie = await MovieLike.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: 'Liked movie not found' });
    }

    console.log('Liked movie updated:', {
      id: updatedMovie._id,
      title: updatedMovie.title
    });

    res.json(updatedMovie);
  } catch (error) {
    console.error('Update liked movie error:', error);
    res.status(500).json({
      message: 'Server error while updating liked movie',
      error: error.message
    });
  }
};

// Remove movie/TV show from likes
exports.removeLikedMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMovie = await MovieLike.findByIdAndDelete(id);

    if (!deletedMovie) {
      return res.status(404).json({ message: 'Liked movie not found' });
    }

    console.log('Liked movie removed:', {
      id: deletedMovie._id,
      title: deletedMovie.title
    });

    res.json({ message: 'Liked movie removed successfully' });
  } catch (error) {
    console.error('Remove liked movie error:', error);
    res.status(500).json({
      message: 'Server error while removing liked movie',
      error: error.message
    });
  }
};

// Remove by movieId and type (for unlike functionality)
exports.unlikeMovie = async (req, res) => {
  try {
    const { movieId, type } = req.body;

    if (!movieId || !type) {
      return res.status(400).json({ 
        message: 'MovieId and type are required' 
      });
    }

    // Convert movieId to Number to match schema
    const numericMovieId = Number(movieId);
    if (isNaN(numericMovieId)) {
      return res.status(400).json({ 
        message: 'MovieId must be a valid number' 
      });
    }

    const deletedMovie = await MovieLike.findOneAndDelete({ movieId: numericMovieId, type });

    if (!deletedMovie) {
      return res.status(404).json({ message: 'Liked movie not found' });
    }

    console.log('Movie unliked:', {
      movieId: deletedMovie.movieId,
      title: deletedMovie.title,
      type: deletedMovie.type
    });

    res.json({ message: 'Movie unliked successfully' });
  } catch (error) {
    console.error('Unlike movie error:', error);
    res.status(500).json({
      message: 'Server error while unliking movie',
      error: error.message
    });
  }
};