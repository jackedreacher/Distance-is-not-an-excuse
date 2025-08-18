/* eslint-env node */
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Socket.IO yapılandırması
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174'],
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

const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});