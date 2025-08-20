/* eslint-env node */
/* eslint-disable no-undef */
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');


// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const moodRoutes = require('./routes/moods');
const wishlistRoutes = require('./routes/wishlist');
const songRoutes = require('./routes/songs');
const surpriseRoutes = require('./routes/surprises');
const taskRoutes = require('./routes/tasks');
const eventRoutes = require('./routes/events');
const movieLikesRoutes = require('./routes/movieLikes');
const videoProxyRoutes = require('./routes/videoProxy');

// Initialize app
const app = express();
const server = createServer(app);

// Socket.IO yapılandırması
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || [
      'http://localhost:5173', 
      'http://127.0.0.1:5173', 
      'http://localhost:5174',
      'https://distance-is-not-an-excuse-e1efyjaae-jackedreachers-projects.vercel.app',
      'https://distance-is-not-an-excuse-j1hpw67i0-jackedreachers-projects.vercel.app'
    ],
    credentials: true
  }
});

// No authentication middleware - allow all connections
io.use(async (socket, next) => {
  // Set a demo user for all connections
  socket.user = {
    id: 'demo-user',
    name: 'Demo User',
    username: 'demo-user'
  };
  socket.userId = 'demo-user';
  next();
});

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || [
    'http://localhost:5173', 
    'http://127.0.0.1:5173', 
    'http://localhost:5174',
    'https://distance-is-not-an-excuse-e1efyjaae-jackedreachers-projects.vercel.app',
    'https://distance-is-not-an-excuse-j1hpw67i0-jackedreachers-projects.vercel.app'
  ],
  credentials: true
})); // Enable CORS with specific origins
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/romantic_app')
.then(() => console.log('Connected to MongoDB'))
.catch((error) => {
  console.error('MongoDB connection error:', error);
  console.log('Starting server without database connection...');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/surprises', surpriseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/movie-likes', movieLikesRoutes);
app.use('/api/video', videoProxyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Romantic App API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Error stack:', err.stack);
  console.error('Error message:', err.message);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app;