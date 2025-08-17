# User Presence and Activity Tracking Features

## Overview

This document outlines the implementation plan for user presence and activity tracking features in the romantic couple's application. These features will enhance the Discord-like experience by showing when partners are online, their current activity, and their availability for communication.

## Presence Tracking Features

### 1. Online/Offline Status

#### Backend Implementation

1. **User Status Model Enhancement** (`backend/src/models/User.js`):
   ```javascript
   // Add to existing User schema
   profile: {
     // ... existing profile fields
     status: {
       type: String,
       enum: ['online', 'offline', 'away', 'busy'],
       default: 'offline'
     },
     lastSeen: {
       type: Date,
       default: Date.now
     },
     customStatus: {
       type: String,
       maxlength: 100,
       trim: true
     }
   }
   ```

2. **Presence Controller** (`backend/src/controllers/presence.js`):
   ```javascript
   const User = require('../models/User');

   // Update user presence status
   exports.updatePresence = async (req, res) => {
     try {
       const { status, customStatus } = req.body;
       const userId = req.user._id;

       // Update user presence
       const updatedUser = await User.findByIdAndUpdate(
         userId,
         {
           'profile.status': status,
           'profile.lastSeen': status === 'offline' ? new Date() : Date.now(),
           'profile.customStatus': customStatus
         },
         { new: true }
       ).select('profile.status profile.lastSeen profile.customStatus');

       // Notify partner of status change
       if (updatedUser.partnerId) {
         // This would be handled via Socket.IO in real-time
         req.io.to(updatedUser.partnerId.toString()).emit('presenceUpdate', {
           userId: userId,
           status: updatedUser.profile.status,
           lastSeen: updatedUser.profile.lastSeen,
           customStatus: updatedUser.profile.customStatus
         });
       }

       res.json(updatedUser);
     } catch (error) {
       console.error('Update presence error:', error);
       res.status(500).json({
         message: 'Server error while updating presence',
         error: error.message
       });
     }
   };

   // Get partner's presence status
   exports.getPartnerPresence = async (req, res) => {
     try {
       const { partnerId } = req.params;
       const user = await User.findById(partnerId).select(
         'profile.status profile.lastSeen profile.customStatus username'
       );

       if (!user) {
         return res.status(404).json({ message: 'Partner not found' });
       }

       res.json(user);
     } catch (error) {
       console.error('Get partner presence error:', error);
       res.status(500).json({
         message: 'Server error while fetching partner presence',
         error: error.message
       });
     }
   };
   ```

3. **Presence Routes** (`backend/src/routes/presence.js`):
   ```javascript
   const express = require('express');
   const router = express.Router();
   const presenceController = require('../controllers/presence');
   const auth = require('../middleware/auth');

   // All routes require authentication
   router.use(auth);

   // Update own presence status
   router.put('/status', presenceController.updatePresence);

   // Get partner's presence status
   router.get('/partner/:partnerId', presenceController.getPartnerPresence);

   module.exports = router;
   ```

#### Frontend Implementation

1. **Presence Service** (`src/services/api.js`):
   ```javascript
   // Add to existing api.js file
   export const presenceService = {
     updateStatus: async (statusData) => {
       const response = await fetch(`${API_BASE_URL}/presence/status`, {
         method: 'PUT',
         headers: getAuthHeaders(),
         body: JSON.stringify(statusData)
       });
       return response.json();
     },

     getPartnerStatus: async (partnerId) => {
       const response = await fetch(`${API_BASE_URL}/presence/partner/${partnerId}`, {
         headers: getAuthHeaders()
       });
       return response.json();
     }
   };
   ```

2. **Presence Context** (`src/contexts/PresenceContext.jsx`):
   ```javascript
   import { createContext, useContext, useEffect, useState } from 'react';
   import { useAuth } from './AuthContext';
   import { presenceService } from '../services/api';
   import { useSocket } from './SocketContext';

   const PresenceContext = createContext();

   export const usePresence = () => {
     const context = useContext(PresenceContext);
     if (!context) {
       throw new Error('usePresence must be used within a PresenceProvider');
     }
     return context;
   };

   export const PresenceProvider = ({ children }) => {
     const [presence, setPresence] = useState({
       status: 'offline',
       lastSeen: null,
       customStatus: ''
     });
     const [partnerPresence, setPartnerPresence] = useState(null);
     const [loading, setLoading] = useState(false);
     const { user } = useAuth();
     const { socket } = useSocket();

     // Load partner presence on component mount
     useEffect(() => {
       if (user && user.partnerId) {
         loadPartnerPresence();
       }
     }, [user]);

     // Set up Socket.IO listeners for real-time presence updates
     useEffect(() => {
       if (!socket) return;

       const handlePresenceUpdate = (data) => {
         if (data.userId === user.partnerId) {
           setPartnerPresence(data);
         }
       };

       socket.on('presenceUpdate', handlePresenceUpdate);

       return () => {
         socket.off('presenceUpdate', handlePresenceUpdate);
       };
     }, [socket, user]);

     const loadPartnerPresence = async () => {
       try {
         setLoading(true);
         const data = await presenceService.getPartnerStatus(user.partnerId);
         setPartnerPresence(data);
       } catch (error) {
         console.error('Error loading partner presence:', error);
       } finally {
         setLoading(false);
       }
     };

     const updatePresence = async (statusData) => {
       try {
         const data = await presenceService.updateStatus(statusData);
         setPresence({
           status: data.profile.status,
           lastSeen: data.profile.lastSeen,
           customStatus: data.profile.customStatus
         });
         
         // Emit update via Socket.IO
         if (socket) {
           socket.emit('updatePresence', statusData);
         }
       } catch (error) {
         console.error('Error updating presence:', error);
       }
     };

     const value = {
       presence,
       partnerPresence,
       loading,
       updatePresence,
       loadPartnerPresence
     };

     return (
       <PresenceContext.Provider value={value}>
         {children}
       </PresenceContext.Provider>
     );
   };
   ```

### 2. Typing Indicators

#### Implementation Details

1. **Frontend Typing Component** (`src/components/TypingIndicator.jsx`):
   ```javascript
   import { useState, useEffect } from 'react';
   import { useSocket } from '../contexts/SocketContext';

   const TypingIndicator = ({ partnerId, onTypingChange }) => {
     const [isPartnerTyping, setIsPartnerTyping] = useState(false);
     const { socket } = useSocket();

     useEffect(() => {
       if (!socket) return;

       const handleTyping = (data) => {
         if (data.userId === partnerId) {
           setIsPartnerTyping(data.isTyping);
           if (onTypingChange) {
             onTypingChange(data.isTyping);
           }
         }
       };

       socket.on('userTyping', handleTyping);

       return () => {
         socket.off('userTyping', handleTyping);
       };
     }, [socket, partnerId, onTypingChange]);

     if (!isPartnerTyping) return null;

     return (
       <div className="typing-indicator">
         <div className="typing-dots">
           <span></span>
           <span></span>
           <span></span>
         </div>
         <span className="typing-text">yazıyor...</span>
       </div>
     );
   };

   export default TypingIndicator;
   ```

2. **Integration with Message Component**:
   ```javascript
   // In Messages.jsx, add typing indicator
   import TypingIndicator from './TypingIndicator';

   // Inside the component
   <div className="message-input-container">
     <TypingIndicator 
       partnerId={partnerId} 
       onTypingChange={setPartnerTyping} 
     />
     {/* ... existing message input ... */}
   </div>
   ```

### 3. Activity Tracking

#### Implementation Plan

1. **Activity Types**:
   - Online (active on the app)
   - Away (inactive for 5 minutes)
   - Busy (do not disturb mode)
   - Offline (not connected)

2. **Automatic Status Updates**:
   ```javascript
   // Frontend activity tracking
   useEffect(() => {
     let activityTimer;
     let awayTimer;

     const resetTimers = () => {
       clearTimeout(activityTimer);
       clearTimeout(awayTimer);
       
       // User is active
       updatePresence({ status: 'online' });
       
       // Set away timer (5 minutes of inactivity)
       awayTimer = setTimeout(() => {
         updatePresence({ status: 'away' });
       }, 5 * 60 * 1000); // 5 minutes
     };

     // Reset timers on user activity
     const handleUserActivity = () => {
       resetTimers();
     };

     // Add event listeners for user activity
     window.addEventListener('mousemove', handleUserActivity);
     window.addEventListener('keydown', handleUserActivity);
     window.addEventListener('touchstart', handleUserActivity);

     // Initial timer setup
     resetTimers();

     return () => {
       clearTimeout(activityTimer);
       clearTimeout(awayTimer);
       window.removeEventListener('mousemove', handleUserActivity);
       window.removeEventListener('keydown', handleUserActivity);
       window.removeEventListener('touchstart', handleUserActivity);
     };
   }, []);
   ```

3. **Custom Status Messages**:
   ```javascript
   // Custom status input component
   const CustomStatusInput = () => {
     const { presence, updatePresence } = usePresence();
     const [customStatus, setCustomStatus] = useState(presence.customStatus || '');
     const [showInput, setShowInput] = useState(false);

     const handleSave = () => {
       updatePresence({ 
         status: presence.status, 
         customStatus 
       });
       setShowInput(false);
     };

     if (!showInput) {
       return (
         <div className="custom-status-display" onClick={() => setShowInput(true)}>
           {presence.customStatus || 'Özel durum ekle...'}
         </div>
       );
     }

     return (
       <div className="custom-status-input">
         <input
           type="text"
           value={customStatus}
           onChange={(e) => setCustomStatus(e.target.value)}
           placeholder="Ne düşünüyorsun?"
           maxLength="100"
         />
         <button onClick={handleSave}>Kaydet</button>
         <button onClick={() => setShowInput(false)}>İptal</button>
       </div>
     );
   };
   ```

### 4. Presence UI Components

#### Presence Badge Component
```javascript
// src/components/PresenceBadge.jsx
import { usePresence } from '../contexts/PresenceContext';

const PresenceBadge = ({ userId, showLastSeen = false }) => {
  const { partnerPresence } = usePresence();
  
  // For now, we'll assume we're showing partner presence
  // In a real app, you'd determine which user's presence to show
  const presenceData = userId === partnerPresence?._id ? partnerPresence : null;
  
  if (!presenceData) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#43b581';
      case 'away': return '#faa61a';
      case 'busy': return '#f04747';
      default: return '#747f8d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Çevrimiçi';
      case 'away': return 'Dışarıda';
      case 'busy': return 'Meşgul';
      default: return 'Çevrimdışı';
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return '';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="presence-badge">
      <div 
        className="status-indicator"
        style={{ backgroundColor: getStatusColor(presenceData.profile?.status || 'offline') }}
      />
      <span className="status-text">
        {getStatusText(presenceData.profile?.status || 'offline')}
      </span>
      {showLastSeen && presenceData.profile?.status === 'offline' && (
        <span className="last-seen">
          Son görülme: {formatLastSeen(presenceData.profile?.lastSeen)}
        </span>
      )}
      {presenceData.profile?.customStatus && (
        <span className="custom-status">
          "{presenceData.profile?.customStatus}"
        </span>
      )}
    </div>
  );
};

export default PresenceBadge;
```

#### Integration with Navigation
```javascript
// In Navigation.jsx
import PresenceBadge from './PresenceBadge';

// Inside the navigation component
<div className="nav-user-info">
  <div className="nav-user-name">
    {user?.profile?.name || user?.username}
  </div>
  <PresenceBadge userId={user?._id} />
</div>
```

## Implementation Steps

1. **Backend Implementation**:
   - Update User model with presence fields
   - Create presence controller and routes
   - Integrate with Socket.IO for real-time updates

2. **Frontend Implementation**:
   - Create presence context and service
   - Develop UI components for presence display
   - Implement activity tracking and automatic status updates

3. **Integration Testing**:
   - Test real-time presence updates
   - Verify status persistence
   - Ensure proper fallback behavior when offline

## Security Considerations

1. **Privacy Controls**: Users should be able to control their visibility
2. **Data Minimization**: Only share necessary presence information
3. **Rate Limiting**: Prevent abuse of presence update endpoints
4. **Authentication**: Ensure only authenticated users can update their presence

## Performance Considerations

1. **Efficient Updates**: Only send presence updates when status changes
2. **Caching**: Cache presence information to reduce database queries
3. **Batch Updates**: Batch presence updates to reduce network traffic
4. **Graceful Degradation**: Handle cases where real-time updates fail

## Future Enhancements

1. **Mobile Integration**: Background presence tracking for mobile apps
2. **Activity Detection**: Integration with device sensors for activity detection
3. **Presence History**: Track and display presence history
4. **Custom Emojis**: Allow custom emojis for presence status