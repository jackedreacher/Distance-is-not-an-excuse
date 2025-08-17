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

// Initialize app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
    credentials: true
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Authenticate socket connection
  socket.on('authenticate', (token) => {
    // In a real implementation, you would verify the JWT token here
    // For now, we'll just emit a success message
    socket.emit('authenticated', { success: true });
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Romantic App API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// For Vercel serverless deployment, we don't need to start the server
// Vercel will handle the server startup automatically
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;