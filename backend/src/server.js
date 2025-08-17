const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

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

// Store active user connections
const activeConnections = new Map();

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('User not found'));
    }
    
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  // Handle multiple device connections for same user
  const userId = socket.userId;
  
  // If user already has active connections, store this as additional connection
  if (activeConnections.has(userId)) {
    const userConnections = activeConnections.get(userId);
    userConnections.add(socket.id);
    console.log(`User ${socket.user.username} now has ${userConnections.size} active connections`);
  } else {
    // First connection for this user
    activeConnections.set(userId, new Set([socket.id]));
  }
  
  // Join user to their personal room
  socket.join(`user_${userId}`);
  
  // Notify other connections of this user about the new connection
  socket.to(`user_${userId}`).emit('newDeviceConnected', {
    deviceId: socket.id,
    timestamp: new Date()
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.user.username} (${socket.id}) - Reason: ${reason}`);
    
    // Remove this connection from active connections
    if (activeConnections.has(userId)) {
      const userConnections = activeConnections.get(userId);
      userConnections.delete(socket.id);
      
      if (userConnections.size === 0) {
        // No more connections for this user
        activeConnections.delete(userId);
        console.log(`User ${socket.user.username} fully disconnected`);
      } else {
        console.log(`User ${socket.user.username} still has ${userConnections.size} active connections`);
        // Notify other connections about this disconnection
        socket.to(`user_${userId}`).emit('deviceDisconnected', {
          deviceId: socket.id,
          timestamp: new Date()
        });
      }
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.user.username}:`, error);
  });
});

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