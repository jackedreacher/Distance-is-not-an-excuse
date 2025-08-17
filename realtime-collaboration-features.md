# Real-Time Collaboration Features

## Overview

This document outlines the real-time collaboration features that will be implemented in the new room/channel system to enable seamless shared content access and editing between partners.

## WebSocket Integration Architecture

### Backend Socket.IO Setup
```javascript
// backend/src/config/socket.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');

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
      socket.userId = user._id.toString();
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);

    // Join user's rooms
    socket.on('joinRoom', async (roomId) => {
      try {
        // Verify user has access to room
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const isMember = room.members.some(member => 
          member.userId.toString() === socket.userId
        );

        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`room_${roomId}`);
        socket.currentRoom = roomId;

        // Notify other users in room
        socket.to(`room_${roomId}`).emit('userJoined', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });

        // Send current room state
        const roomState = await getRoomState(roomId);
        socket.emit('roomState', roomState);
      } catch (error) {
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Handle content updates
    socket.on('contentUpdate', (data) => {
      // Broadcast to all users in the room except sender
      socket.to(`room_${data.roomId}`).emit('contentUpdated', {
        ...data,
        userId: socket.userId,
        username: socket.user.username,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typingStart', (data) => {
      socket.to(`room_${data.roomId}`).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        channelId: data.channelId,
        timestamp: new Date()
      });
    });

    socket.on('typingStop', (data) => {
      socket.to(`room_${data.roomId}`).emit('userStopTyping', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // Handle presence updates
    socket.on('updatePresence', (data) => {
      socket.to(`room_${data.roomId}`).emit('presenceUpdated', {
        userId: socket.userId,
        username: socket.user.username,
        status: data.status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
      
      if (socket.currentRoom) {
        socket.to(`room_${socket.currentRoom}`).emit('userLeft', {
          userId: socket.userId,
          username: socket.user.username,
          timestamp: new Date()
        });
      }
    });
  });

  return io;
};

// Helper function to get room state
const getRoomState = async (roomId) => {
  // Implementation to fetch current room state
  // This would include active users, recent messages, etc.
  return {
    roomId,
    activeUsers: [], // List of currently connected users
    recentActivity: [] // Recent content updates
  };
};

module.exports = initializeSocketIO;
```

### Frontend Socket Context
```javascript
// src/contexts/SocketContext.jsx
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
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      return;
    }

    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
    });

    newSocket.on('roomState', (state) => {
      setRoomState(state);
    });

    newSocket.on('contentUpdated', (data) => {
      // Handle content updates
      console.log('Content updated:', data);
      // Update local state or trigger re-render
    });

    newSocket.on('userTyping', (data) => {
      // Handle typing indicators
      console.log('User typing:', data);
    });

    newSocket.on('userStopTyping', (data) => {
      // Handle typing stop indicators
      console.log('User stopped typing:', data);
    });

    newSocket.on('presenceUpdated', (data) => {
      // Handle presence updates
      console.log('Presence updated:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user]);

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId);
    }
  };

  const updateContent = (data) => {
    if (socket) {
      socket.emit('contentUpdate', data);
    }
  };

  const startTyping = (data) => {
    if (socket) {
      socket.emit('typingStart', data);
    }
  };

  const stopTyping = (data) => {
    if (socket) {
      socket.emit('typingStop', data);
    }
  };

  const updatePresence = (data) => {
    if (socket) {
      socket.emit('updatePresence', data);
    }
  };

  const value = {
    socket,
    connected,
    roomState,
    joinRoom,
    updateContent,
    startTyping,
    stopTyping,
    updatePresence
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
```

## Real-Time Features Implementation

### 1. Shared Wishlist with Real-Time Updates
```javascript
// src/components/SharedWishlist.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { sharedWishlistService } from '../services/sharedWishlistService';

const SharedWishlist = ({ channelId, roomId }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'restaurants',
    description: '',
    priority: 'medium',
  });
  const [typingUsers, setTypingUsers] = useState([]);
  const { socket, updateContent, startTyping, stopTyping } = useSocket();

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

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleContentUpdated = (data) => {
      if (data.channelId === channelId) {
        // Update local state with new/updated item
        setItems(prev => {
          const existingIndex = prev.findIndex(item => item._id === data.item._id);
          if (existingIndex >= 0) {
            const newItems = [...prev];
            newItems[existingIndex] = data.item;
            return newItems;
          } else {
            return [data.item, ...prev];
          }
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          const existingIndex = prev.findIndex(user => user.userId === data.userId);
          if (existingIndex >= 0) {
            const newUsers = [...prev];
            newUsers[existingIndex] = data;
            return newUsers;
          } else {
            return [...prev, data];
          }
        });
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => 
          prev.filter(user => user.userId !== data.userId)
        );
      }
    };

    socket.on('contentUpdated', handleContentUpdated);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);

    return () => {
      socket.off('contentUpdated', handleContentUpdated);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
    };
  }, [socket, channelId]);

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      const itemData = {
        ...newItem,
        channelId,
        completed: false
      };

      const data = await sharedWishlistService.create(itemData);
      
      // Notify other users of the new item
      updateContent({
        type: 'wishlistItemAdded',
        roomId,
        channelId,
        item: data
      });

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
        
        // Notify other users of the update
        updateContent({
          type: 'wishlistItemUpdated',
          roomId,
          channelId,
          item: data
        });

        setItems(prev => prev.map(item =>
          item._id === id ? data : item
        ));
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));

    // Send typing indicator
    startTyping({
      roomId,
      channelId,
      field: name
    });
  };

  return (
    <div className="shared-wishlist-container">
      <div className="wishlist-header">
        <h2>💕 Ortak Dilek Listemiz 💕</h2>
        {typingUsers.length > 0 && (
          <div className="typing-indicators">
            {typingUsers.map(user => (
              <span key={user.userId} className="typing-user">
                {user.username} yazıyor...
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Rest of the wishlist UI with real-time features */}
    </div>
  );
};

export default SharedWishlist;
```

### 2. Real-Time Mood Tracker
```javascript
// src/components/SharedMoodTracker.jsx
import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { sharedMoodService } from '../services/sharedMoodService';

const SharedMoodTracker = ({ channelId, roomId }) => {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [message, setMessage] = useState('');
  const { socket, updateContent } = useSocket();

  useEffect(() => {
    const loadMoods = async () => {
      try {
        const data = await sharedMoodService.getChannelMoods(channelId);
        setMoods(data);
      } catch (error) {
        console.error('Error loading moods:', error);
      }
    };

    if (channelId) {
      loadMoods();
    }
  }, [channelId]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleContentUpdated = (data) => {
      if (data.type === 'moodAdded' && data.channelId === channelId) {
        setMoods(prev => [data.mood, ...prev]);
      }
    };

    socket.on('contentUpdated', handleContentUpdated);

    return () => {
      socket.off('contentUpdated', handleContentUpdated);
    };
  }, [socket, channelId]);

  const handleAddMood = async () => {
    if (!selectedMood) return;

    try {
      const moodData = {
        channelId,
        mood: selectedMood,
        message
      };

      const data = await sharedMoodService.create(moodData);
      
      // Notify other users
      updateContent({
        type: 'moodAdded',
        roomId,
        channelId,
        mood: data
      });

      setMoods(prev => [data, ...prev]);
      setSelectedMood('');
      setMessage('');
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  return (
    <div className="shared-mood-tracker-container">
      <div className="mood-tracker-header">
        <h2>😊 Ortak Ruh Halimiz 😊</h2>
      </div>
      
      {/* Mood tracker UI with real-time features */}
    </div>
  );
};

export default SharedMoodTracker;
```

## Real-Time Collaboration Patterns

### 1. Optimistic Updates
```javascript
// Example of optimistic update pattern
const handleOptimisticUpdate = async (updateFunction, optimisticData, rollbackFunction) => {
  try {
    // Apply optimistic update immediately
    setItems(prev => [...prev, optimisticData]);
    
    // Perform actual update
    const result = await updateFunction(optimisticData);
    
    // Update with actual result
    setItems(prev => prev.map(item => 
      item.tempId === optimisticData.tempId ? result : item
    ));
    
    return result;
  } catch (error) {
    // Rollback on error
    setItems(prev => prev.filter(item => item.tempId !== optimisticData.tempId));
    rollbackFunction && rollbackFunction(error);
    throw error;
  }
};
```

### 2. Conflict Resolution
```javascript
// Example of conflict resolution for collaborative editing
const handleContentConflict = (localContent, remoteContent) => {
  // Simple last-write-wins approach
  if (new Date(remoteContent.updatedAt) > new Date(localContent.updatedAt)) {
    return remoteContent;
  }
  return localContent;
};
```

### 3. Presence Management
```javascript
// Example of presence management
const PresenceIndicator = ({ userId, roomId }) => {
  const [isOnline, setIsOnline] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePresenceUpdate = (data) => {
      if (data.userId === userId) {
        setIsOnline(data.status === 'online');
      }
    };

    socket.on('presenceUpdated', handlePresenceUpdate);

    return () => {
      socket.off('presenceUpdated', handlePresenceUpdate);
    };
  }, [socket, userId]);

  return (
    <div className={`presence-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? '🟢' : '🔴'}
    </div>
  );
};
```

## Performance Considerations

### 1. Efficient Event Handling
```javascript
// Throttle frequent events
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// Use throttling for typing indicators
const throttledTyping = throttle((data) => {
  startTyping(data);
}, 1000);
```

### 2. Memory Management
```javascript
// Clean up event listeners properly
useEffect(() => {
  // Setup listeners
  const cleanup = setupListeners();
  
  // Cleanup on unmount
  return () => {
    cleanup();
  };
}, []);
```

## Error Handling and Recovery

### 1. Connection Resilience
```javascript
// Handle reconnection attempts
socket.on('connect', () => {
  console.log('Reconnected to server');
  // Resync room state
  resyncRoomState();
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Attempt to reconnect
  if (reason === 'io server disconnect') {
    socket.connect();
  }
});
```

### 2. Data Synchronization
```javascript
// Handle data sync after disconnection
const resyncRoomState = async () => {
  try {
    const serverState = await fetchRoomState(roomId);
    const localState = getLocalState();
    
    // Merge states
    const mergedState = mergeStates(localState, serverState);
    updateLocalState(mergedState);
  } catch (error) {
    console.error('Error syncing room state:', error);
  }
};
```

## Conclusion

The real-time collaboration features will transform the couple's application into a truly interactive platform where both partners can collaborate seamlessly on shared content. With WebSocket integration, optimistic updates, conflict resolution, and presence management, the new system will provide a smooth and engaging user experience that strengthens the couple's connection through shared digital experiences.