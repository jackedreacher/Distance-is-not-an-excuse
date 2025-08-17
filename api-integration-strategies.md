# API Integration Strategies

## Overview

This document outlines the API integration strategies for implementing Discord-like features in the romantic couple's application. It covers REST API design, WebSocket integration, authentication approaches, and best practices for seamless communication between frontend and backend services.

## REST API Integration Strategy

### API Design Principles

1. **Consistent Naming Conventions**
   - Use plural nouns for collections (e.g., `/api/messages`, `/api/channels`)
   - Use hyphens for multi-word resources (e.g., `/api/voice-calls`)
   - Use HTTP verbs for actions (GET, POST, PUT, DELETE)

2. **Versioning**
   - API version in URL: `/api/v1/messages`
   - Maintain backward compatibility
   - Document breaking changes

3. **Response Format**
   - Consistent JSON structure
   - Standard error responses
   - Pagination for large datasets
   - Metadata in responses

### Authentication Strategy

#### JWT Token Management
```javascript
// Frontend authentication service
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Token refresh mechanism
const refreshToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: localStorage.getItem('refreshToken')
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      return data.token;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to login
  }
};
```

#### Protected Route Implementation
```javascript
// Backend middleware for authentication
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      message: 'Authentication failed' 
    });
  }
};
```

### Error Handling Strategy

#### Standardized Error Responses
```javascript
// Backend error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // MongoDB duplicate key errors
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate entry found'
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token'
    });
  }
  
  // Default error
  res.status(500).json({
    message: 'Internal server error'
  });
};
```

### Rate Limiting Strategy

#### API Rate Limiting
```javascript
// Backend rate limiting middleware
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Apply to all API routes
app.use('/api/', apiLimiter);
```

## WebSocket Integration Strategy

### Socket.IO Authentication

#### Client-Side Authentication
```javascript
// Frontend Socket.IO connection with authentication
import { io } from 'socket.io-client';

const initializeSocket = () => {
  const token = localStorage.getItem('token');
  
  const socket = io(process.env.REACT_APP_API_URL, {
    auth: {
      token: token
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  });
  
  // Handle connection events
  socket.on('connect', () => {
    console.log('Connected to Socket.IO server');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Disconnected from Socket.IO server:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
  
  return socket;
};
```

#### Server-Side Authentication
```javascript
// Backend Socket.IO authentication middleware
const initializeSocketIO = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });
  
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);
    
    // Join user's private room
    socket.join(`user_${socket.user._id}`);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
    });
  });
  
  return io;
};
```

### Event Naming Conventions

#### Client-to-Server Events
- `sendMessage` - Send a new message
- `joinChannel` - Join