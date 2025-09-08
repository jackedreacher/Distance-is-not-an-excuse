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
const quotesRoutes = require('./routes/quotes');

// Initialize app
const app = express();
const server = createServer(app);

// Allowlist origins (ENV can be comma-separated)
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];
// Accept any Vercel frontend by default if not explicitly configured
const DEFAULT_ORIGIN_PATTERNS = [/^https?:\/\/[a-z0-9-]+\.vercel\.app$/i];

const envOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = envOrigins.length ? envOrigins : DEFAULT_ORIGINS;

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // non-browser or same-origin
  // Direct match
  if (allowedOrigins.includes(origin)) return callback(null, true);
  // Pattern match (e.g., any *.vercel.app)
  if (DEFAULT_ORIGIN_PATTERNS.some((re) => re.test(origin))) return callback(null, true);
  return callback(new Error('Not allowed by CORS'), false);
};

// Socket.IO configuration (reflects request origin when allowed)
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

// No authentication middleware - allow all connections
io.use(async (socket, next) => {
  // Assign a per-connection identity
  socket.user = {
    id: socket.id,
    name: 'Demo User',
    username: `user-${socket.id.slice(-4)}`
  };
  socket.userId = socket.id;
  next();
});

// In-memory chat history per room (last 50 messages)
const roomMessages = new Map();

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username}`);
  
  // Join a chat room
  socket.on('chat:join', ({ roomId, name }) => {
    if (!roomId) return;
    socket.join(roomId);
    socket.data.name = name || 'Guest';

    // Send recent history to the newly joined socket
    const history = roomMessages.get(roomId) || [];
    socket.emit('chat:history', history);

    // Notify others in the room
    socket.to(roomId).emit('chat:system', { type: 'join', name: socket.data.name, at: Date.now() });
  });

  // Receive and broadcast a message
  socket.on('chat:message', ({ roomId, text, name, tempId }) => {
    if (!roomId || !text) return;
    const msg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      text: String(text).slice(0, 2000),
      name: name || socket.data.name || 'Guest',
      senderId: socket.id,
      at: Date.now(),
      tempId: tempId || null,
      deleted: false
    };

    const list = roomMessages.get(roomId) || [];
    list.push(msg);
    // Keep only last 50
    if (list.length > 50) list.splice(0, list.length - 50);
    roomMessages.set(roomId, list);

    io.to(roomId).emit('chat:message', msg);
  });

  // Typing indicators
  socket.on('chat:typing', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('chat:typing', { name: socket.data.name || 'Guest', at: Date.now() });
  });
  socket.on('chat:stopTyping', ({ roomId }) => {
    if (!roomId) return;
    socket.to(roomId).emit('chat:stopTyping', { name: socket.data.name || 'Guest', at: Date.now() });
  });

  // Delete message (soft delete)
  socket.on('chat:delete', ({ roomId, messageId }) => {
    if (!roomId || !messageId) return;
    const list = roomMessages.get(roomId) || [];
    const msg = list.find((m) => m.id === messageId);
    if (msg) {
      msg.deleted = true;
      io.to(roomId).emit('chat:deleted', { id: messageId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: corsOrigin,
  credentials: true
})); // Enable CORS with specific origins
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Connect to MongoDB (optional for chat)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/romantic_app')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => {
    console.error('MongoDB connection error:', error);
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
app.use('/api/quotes', quotesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: Date.now() });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Start the server only in development (Vercel will handle production)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Vercel serverless entrypoint: emit requests to our HTTP server (so Socket.IO handles /socket.io)
module.exports = (req, res) => {
  server.emit('request', req, res);
};