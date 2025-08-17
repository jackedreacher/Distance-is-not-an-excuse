# Room/Channel Architecture for Shared Content

## Overview

This document outlines a new architectural approach for the romantic couple's application that implements a Discord-like room/channel system. This system will allow both partners to access and edit the same content, solving the current limitation where each item is owned by a specific user.

## Current System Limitations

### Ownership-Based Model
The current system uses an ownership-based model where:
- Each content item (wishlist, mood tracker entries, etc.) is owned by a specific user
- Only the owner can modify or delete their items
- Partners can view each other's items but cannot edit them
- This creates a barrier to true collaborative experiences

### Access Issues
- Partners cannot jointly manage shared content
- No shared spaces for collaborative planning
- Limited real-time collaboration features
- No way to assign tasks or items to both partners

## New Room/Channel Architecture

### Core Concepts

#### Rooms
- **Private Couple Room**: A dedicated space for the couple (similar to a Discord server)
- **Room Types**: 
  - Private (only the couple can access)
  - Shared (for collaborative content)
  - Personal (individual partner spaces)

#### Channels
- **Content Channels**: Dedicated spaces for different types of content
  - `#wishlist` - Shared wishlist items
  - `#mood-tracker` - Joint mood tracking
  - `#music` - Shared playlist management
  - `#memories` - Photo and memory sharing
  - `#planning` - Date and activity planning
  - `#tasks` - Shared task management

#### Shared Content Model
- Content items belong to channels, not individual users
- Both partners can create, read, update, and delete items in shared channels
- Ownership is tracked for attribution but doesn't restrict access
- Version history and collaborative editing features

## Data Models

### Room Model
```javascript
// backend/src/models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  },
  type: {
    type: String,
    enum: ['private', 'shared', 'personal'],
    default: 'shared'
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update timestamp
roomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Room', roomSchema);
```

### Channel Model
```javascript
// backend/src/models/Channel.js
const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'notes', 'wishlist', 'mood', 'music', 'planning', 'tasks'],
    default: 'text'
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  topic: {
    type: String,
    maxlength: 100,
    trim: true
  },
  position: {
    type: Number,
    default: 0
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      manage: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-update timestamp
channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Channel', channelSchema);
```

### Shared Content Models

#### Shared Wishlist Item
```javascript
// backend/src/models/SharedWishlist.js
const mongoose = require('mongoose');

const sharedWishlistSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
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
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completedDate: {
    type: Date
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
sharedWishlistSchema.index({ channelId: 1, category: 1 });
sharedWishlistSchema.index({ channelId: 1, priority: 1 });
sharedWishlistSchema.index({ channelId: 1, completed: 1 });

// Auto-update timestamp
sharedWishlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SharedWishlist', sharedWishlistSchema);
```

#### Shared Mood Tracker Entry
```javascript
// backend/src/models/SharedMood.js
const mongoose = require('mongoose');

const sharedMoodSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    required: [true, 'Mood is required'],
    enum: ['happy', 'sad', 'angry', 'excited', 'tired', 'calm', 'anxious', 'grateful'],
    trim: true
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
sharedMoodSchema.index({ channelId: 1, userId: 1, createdAt: -1 });

// Auto-update timestamp
sharedMoodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('SharedMood', sharedMoodSchema);
```

## Component Integration Plan

### Navigation with Rooms and Channels
```javascript
// src/components/RoomNavigation.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/roomService';

const RoomNavigation = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await roomService.getUserRooms();
        setRooms(data);
        if (data.length > 0) {
          setActiveRoom(data[0]);
          if (data[0].channels.length > 0) {
            setActiveChannel(data[0].channels[0]);
          }
        }
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    };

    if (user) {
      loadRooms();
    }
  }, [user]);

  return (
    <div className="room-navigation">
      <div className="rooms-list">
        {rooms.map(room => (
          <div 
            key={room._id} 
            className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
            onClick={() => setActiveRoom(room)}
          >
            <div className="room-name">{room.name}</div>
            <div className="room-channels">
              {room.channels.map(channel => (
                <div 
                  key={channel._id}
                  className={`channel-item ${activeChannel?._id === channel._id ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChannel(channel);
                  }}
                >
                  # {channel.name}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomNavigation;
```

### Shared Wishlist Component
```javascript
// src/components/SharedWishlist.jsx
import { useState, useEffect } from 'react';
import { sharedWishlistService } from '../services/sharedWishlistService';

const SharedWishlist = ({ channelId }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'restaurants',
    description: '',
    priority: 'medium',
  });

  useEffect(() => {
    const loadWishlist = async () => {
      try {
        const data = await sharedWishlistService.getChannelItems(channelId);
        setItems(data);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };

    if (channelId) {
      loadWishlist();
    }
  }, [channelId]);

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      const itemData = {
        ...newItem,
        channelId,
        completed: false
      };

      const data = await sharedWishlistService.create(itemData);
      setItems(prev => [data, ...prev]);
      setNewItem({
        title: '',
        category: 'restaurants',
        description: '',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error saving wishlist item:', error);
    }
  };

  const toggleCompleted = async (id) => {
    try {
      const itemToUpdate = items.find(item => item._id === id);
      if (itemToUpdate) {
        const updatedData = { 
          ...itemToUpdate, 
          completed: !itemToUpdate.completed,
          completedBy: itemToUpdate.completed ? null : getCurrentUserId()
        };
        const data = await sharedWishlistService.update(id, updatedData);
        setItems(prev => prev.map(item =>
          item._id === id ? data : item
        ));
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    }
  };

  return (
    <div className="shared-wishlist-container">
      {/* Shared wishlist UI with collaborative features */}
      {/* Both partners can add, edit, and complete items */}
    </div>
  );
};

export default SharedWishlist;
```

## Real-Time Collaboration Features

### WebSocket Integration
```javascript
// backend/src/config/socket.js
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

    // Join user's rooms
    socket.on('joinRoom', (roomId) => {
      socket.join(`room_${roomId}`);
    });

    // Handle content updates
    socket.on('contentUpdate', (data) => {
      // Broadcast to all users in the room
      socket.to(`room_${data.roomId}`).emit('contentUpdated', data);
    });

    // Handle typing indicators
    socket.on('typingStart', (data) => {
      socket.to(`room_${data.roomId}`).emit('userTyping', {
        userId: socket.user._id,
        username: socket.user.username,
        channelId: data.channelId
      });
    });

    socket.on('typingStop', (data) => {
      socket.to(`room_${data.roomId}`).emit('userStopTyping', {
        userId: socket.user._id,
        channelId: data.channelId
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
    });
  });

  return io;
};
```

## Access Control and Permissions

### Role-Based Access Control
```javascript
// backend/src/middleware/channelAuth.js
const Channel = require('../models/Channel');

const checkChannelAccess = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    // Find channel and verify user has access
    const channel = await Channel.findById(channelId).populate('roomId');
    
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Check if user is a member of the room
    const isMember = channel.roomId.members.some(member => 
      member.userId.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: Not a member of this room' });
    }

    // Check specific permissions
    const userPermissions = channel.members.find(member => 
      member.userId.toString() === userId.toString()
    )?.permissions || { read: true, write: true, manage: false };

    req.userPermissions = userPermissions;
    next();
  } catch (error) {
    console.error('Channel access error:', error);
    res.status(500).json({
      message: 'Server error while checking channel access',
      error: error.message
    });
  }
};

const requireWritePermission = (req, res, next) => {
  if (!req.userPermissions.write) {
    return res.status(403).json({ message: 'Write permission required' });
  }
  next();
};

module.exports = {
  checkChannelAccess,
  requireWritePermission
};
```

## Implementation Roadmap

### Phase 1: Core Room/Channel System (Weeks 1-2)
1. Create Room and Channel data models
2. Implement Room and Channel API endpoints
3. Develop basic Room/Channel UI components
4. Set up authentication and authorization for rooms

### Phase 2: Shared Content Features (Weeks 3-4)
1. Create shared content models (Wishlist, Mood Tracker, etc.)
2. Implement shared content API endpoints
3. Develop shared content UI components
4. Add real-time collaboration features

### Phase 3: Advanced Features (Weeks 5-6)
1. Implement permissions and access control
2. Add notification system for content updates
3. Create mobile-responsive UI
4. Implement offline support and synchronization

### Phase 4: Testing and Optimization (Weeks 7-8)
1. Comprehensive testing of collaborative features
2. Performance optimization
3. Security audit
4. User experience improvements

## Benefits of New Architecture

### Enhanced Collaboration
- Both partners can access and edit shared content
- Real-time updates and notifications
- Version history and change tracking
- Assignment and task management

### Improved Organization
- Dedicated spaces for different content types
- Better content discovery and navigation
- Customizable room and channel structure
- Archiving and content lifecycle management

### Better User Experience
- More intuitive interface similar to popular communication platforms
- Seamless switching between different content types
- Enhanced privacy controls
- Personal and shared space differentiation

## Conclusion

This new room/channel architecture addresses the current system's limitations by providing a collaborative environment where both partners can access and edit the same content. The implementation will transform the application into a more interactive and engaging platform that strengthens the couple's connection through shared experiences and collaborative planning.