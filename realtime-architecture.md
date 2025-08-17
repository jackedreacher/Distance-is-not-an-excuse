# Real-time Communication Architecture for Romantic Couple's App

## Overview

This document outlines the real-time communication architecture for the romantic couple's application using Socket.IO. The implementation will enable Discord-like messaging features including real-time text messaging, presence indicators, and typing indicators.

## Architecture Components

### 1. Backend Integration

#### Socket.IO Server Setup

The Socket.IO server will be integrated with the existing Express server in `backend/src/server.js`. The integration will include:

1. Installing Socket.IO dependencies:
   ```bash
   npm install socket.io socket.io-client
   ```

2. Creating a Socket.IO configuration file (`backend/src/config/socket.js`):
   ```javascript
   const socketIO = require('socket.io');
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');

   const initializeSocket = (server) => {
     const io = socketIO(server, {
       cors: {
         origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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
       socket.join(socket.user._id.toString());

       // Notify partner of user's online status
       if (socket.user.partnerId) {
         socket.to(socket.user.partnerId.toString()).emit('userOnline', {
           userId: socket.user._id,
           username: socket.user.username
         });
       }

       // Handle disconnection
       socket.on('disconnect', () => {
         console.log('User disconnected:', socket.user.username);
         if (socket.user.partnerId) {
           socket.to(socket.user.partnerId.toString()).emit('userOffline', {
             userId: socket.user._id,
             username: socket.user.username
           });
         }
       });

       // Handle message sending
       socket.on('sendMessage', (data) => {
         const messageData = {
           ...data,
           senderId: socket.user._id,
           senderName: socket.user.username,
           timestamp: new Date()
         };

         // Send to recipient
         if (data.recipientId) {
           socket.to(data.recipientId).emit('receiveMessage', messageData);
         }

         // Send to sender's other devices (if any)
         socket.emit('messageSent', messageData);
       });

       // Handle typing indicators
       socket.on('typing', (data) => {
         if (data.recipientId) {
           socket.to(data.recipientId).emit('userTyping', {
             userId: socket.user._id,
             username: socket.user.username,
             isTyping: data.isTyping
           });
         }
       });

       // Handle read receipts
       socket.on('messageRead', (data) => {
         if (data.senderId) {
           socket.to(data.senderId).emit('messageDelivered', {
             messageId: data.messageId,
             readAt: new Date()
           });
         }
       });
     });

     return io;
   };

   module.exports = initializeSocket;
   ```

3. Modifying `backend/src/server.js` to integrate Socket.IO:
   ```javascript
   // Add Socket.IO initialization
   const initializeSocket = require('./config/socket');
   
   // After creating the Express app and before starting the server
   const server = app.listen(PORT, () => {
     console.log(`Server is running on port ${PORT}`);
   });
   
   // Initialize Socket.IO
   const io = initializeSocket(server);
   ```

### 2. Frontend Integration

#### Socket.IO Client Setup

1. Install Socket.IO client dependencies:
   ```bash
   npm install socket.io-client
   ```

2. Create a Socket context (`src/contexts/SocketContext.jsx`):
   ```javascript
   import { createContext, useContext, useEffect, useState } from 'react';
   import { io } from 'socket.io-client';
   import { useAuth } from './AuthContext';

   const SocketContext = createContext();

   export const useSocket = () => {
     const context = useContext(SocketContext);
     if (!context) {
       throw new Error('useSocket must be used within a SocketProvider');
     }
     return context;
   };

   export const SocketProvider = ({ children }) => {
     const [socket, setSocket] = useState(null);
     const [onlineUsers, setOnlineUsers] = useState({});
     const [messages, setMessages] = useState([]);
     const { user } = useAuth();

     useEffect(() => {
       if (user) {
         const newSocket = io('http://localhost:5000', {
           auth: {
             token: localStorage.getItem('token')
           }
         });

         newSocket.on('connect', () => {
           console.log('Connected to Socket.IO server');
         });

         newSocket.on('receiveMessage', (message) => {
           setMessages(prev => [...prev, message]);
         });

         newSocket.on('userOnline', (userData) => {
           setOnlineUsers(prev => ({ ...prev, [userData.userId]: true }));
         });

         newSocket.on('userOffline', (userData) => {
           setOnlineUsers(prev => ({ ...prev, [userData.userId]: false }));
         });

         newSocket.on('userTyping', (data) => {
           // Handle typing indicator
         });

         newSocket.on('messageDelivered', (data) => {
           // Handle message delivery confirmation
         });

         setSocket(newSocket);

         return () => {
           newSocket.disconnect();
         };
       }
     }, [user]);

     const sendMessage = (messageData) => {
       if (socket) {
         socket.emit('sendMessage', messageData);
       }
     };

     const sendTypingIndicator = (isTyping, recipientId) => {
       if (socket) {
         socket.emit('typing', { isTyping, recipientId });
       }
     };

     const markMessageAsRead = (messageId, senderId) => {
       if (socket) {
         socket.emit('messageRead', { messageId, senderId });
       }
     };

     const value = {
       socket,
       onlineUsers,
       messages,
       sendMessage,
       sendTypingIndicator,
       markMessageAsRead
     };

     return (
       <SocketContext.Provider value={value}>
         {children}
       </SocketContext.Provider>
     );
   };
   ```

3. Update `src/main.jsx` to include the SocketProvider:
   ```javascript
   import { SocketProvider } from './contexts/SocketContext';

   // Wrap the App component with SocketProvider
   <AuthProvider>
     <SocketProvider>
       <App />
     </SocketProvider>
   </AuthProvider>
   ```

### 3. Message Data Model

#### Backend Message Model (`backend/src/models/Message.js`)

```javascript
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice'],
    default: 'text'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  delivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
```

### 4. Message Controller (`backend/src/controllers/messages.js`)

```javascript
const Message = require('../models/Message');
const User = require('../models/User');

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUserId = req.user._id;

    // Validate partner exists
    const partner = await User.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    // Get messages between users
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, recipientId: partnerId },
        { senderId: partnerId, recipientId: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('senderId', 'username profile.name profile.gender');

    res.json(messages);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      message: 'Server error while fetching conversation',
      error: error.message
    });
  }
};

// Send new message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, messageType } = req.body;
    const senderId = req.user._id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create message
    const newMessage = new Message({
      senderId,
      recipientId,
      content,
      messageType: messageType || 'text'
    });

    await newMessage.save();

    // Populate sender info
    await newMessage.populate('senderId', 'username profile.name profile.gender');

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      message: 'Server error while sending message',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    // Find message and update read status
    const message = await Message.findOneAndUpdate(
      { _id: messageId, recipientId: userId },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    res.json(message);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      message: 'Server error while marking message as read',
      error: error.message
    });
  }
};
```

### 5. Message Routes (`backend/src/routes/messages.js`)

```javascript
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messages');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get conversation with partner
router.get('/conversation/:partnerId', messageController.getConversation);

// Send new message
router.post('/', messageController.sendMessage);

// Mark message as read
router.put('/:messageId/read', messageController.markAsRead);

module.exports = router;
```

### 6. Frontend Message Component (`src/components/Messages.jsx`)

```javascript
import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { messageService } from '../services/api';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, sendMessage, sendTypingIndicator } = useSocket();
  const { user } = useAuth();

  // Load conversation on component mount
  useEffect(() => {
    const loadConversation = async () => {
      try {
        setLoading(true);
        // Assuming partner ID is available from context or props
        const data = await messageService.getConversation(partnerId);
        setMessages(data);
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle incoming messages from Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleTyping = (data) => {
      setPartnerTyping(data.isTyping);
    };

    socket.on('receiveMessage', handleMessage);
    socket.on('userTyping', handleTyping);

    return () => {
      socket.off('receiveMessage', handleMessage);
      socket.off('userTyping', handleTyping);
    };
  }, [socket]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Send via Socket.IO for real-time delivery
      sendMessage({
        recipientId: partnerId,
        content: newMessage,
        messageType: 'text'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      sendTypingIndicator(typing, partnerId);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h2>💕 Mesajlar 💕</h2>
      </div>

      <div className="messages-content">
        {loading ? (
          <div className="loading">Mesajlar yükleniyor...</div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div 
                key={message._id} 
                className={`message-bubble ${
                  message.senderId._id === user._id ? 'sent' : 'received'
                }`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-meta">
                  <span className="message-time">
                    {formatTime(message.createdAt)}
                  </span>
                  {message.senderId._id === user._id && message.read && (
                    <span className="message-read">✓✓</span>
                  )}
                </div>
              </div>
            ))}
            {partnerTyping && (
              <div className="message-bubble received typing-indicator">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="message-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              handleTyping(true);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === 'Enter' && e.shiftKey) {
              handleTyping(false);
            }
          }}
          placeholder="Mesajınızı yazın..."
          className="message-input"
          rows="3"
        />
        <button 
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="send-button"
        >
          Gönder
        </button>
      </div>
    </div>
  );
};

export default Messages;
```

## Security Considerations

1. **Authentication**: All Socket.IO connections require JWT token authentication
2. **Authorization**: Messages can only be sent to partners
3. **Data Validation**: All message content is validated and sanitized
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Encryption**: Use HTTPS/WSS for secure communication

## Scalability Considerations

1. **Room-based Architecture**: Users are placed in private rooms
2. **Horizontal Scaling**: Use Redis adapter for multi-server deployments
3. **Message Persistence**: Store messages in MongoDB for history
4. **Load Balancing**: Distribute connections across multiple server instances

## Implementation Steps

1. Install Socket.IO dependencies in backend
2. Create Socket.IO configuration and integration
3. Implement message data model and controllers
4. Add message routes to the backend
5. Create frontend Socket context and provider
6. Develop message UI components
7. Implement real-time features (typing indicators, read receipts)
8. Test authentication and authorization
9. Deploy and monitor performance

## Future Enhancements

1. Message reactions and replies
2. File and image sharing
3. Voice messaging capabilities
4. Message search and filtering
5. Message scheduling
6. End-to-end encryption