# Component Integration Plan with Room System

## Overview

This document outlines how existing components will be integrated with the new room/channel system to enable shared content access and collaboration between partners.

## Current Components Analysis

### Existing Components That Need Integration
1. **Wishlist** - Will be moved to shared wishlist channels
2. **Mood Tracker** - Will be moved to shared mood tracking channels
3. **Music Player/Playlist** - Will be moved to shared music channels
4. **Surprise Notifications** - Will be moved to shared planning channels
5. **Mesafe Oyunu** - Will be moved to shared gaming channels
6. **Movie Recommendations** - Will be moved to shared entertainment channels

### Components That Will Remain Individual
1. **Countdown Timer** - Personal dashboard component
2. **Gift Box** - Interactive personal feature
3. **Daily Motivation** - Personal inspiration component

## Integration Strategy

### 1. Room-Based Navigation
```javascript
// src/components/RoomNavigation.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/roomService';

const RoomNavigation = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [expandedRooms, setExpandedRooms] = useState({});

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await roomService.getUserRooms();
        setRooms(data);
        if (data.length > 0) {
          setActiveRoom(data[0]);
        }
      } catch (error) {
        console.error('Error loading rooms:', error);
      }
    };

    if (user) {
      loadRooms();
    }
  }, [user]);

  const toggleRoomExpansion = (roomId) => {
    setExpandedRooms(prev => ({
      ...prev,
      [roomId]: !prev[roomId]
    }));
  };

  return (
    <div className="room-navigation">
      <div className="navigation-header">
        <h3>Odalarımız</h3>
      </div>
      
      <div className="rooms-list">
        {rooms.map(room => (
          <div key={room._id} className="room-container">
            <div 
              className={`room-item ${activeRoom?._id === room._id ? 'active' : ''}`}
              onClick={() => {
                setActiveRoom(room);
                toggleRoomExpansion(room._id);
              }}
            >
              <div className="room-icon">
                {room.type === 'private' ? '🔒' : '🏠'}
              </div>
              <div className="room-name">{room.name}</div>
              <div className="room-expand-icon">
                {expandedRooms[room._id] ? '▼' : '▶'}
              </div>
            </div>
            
            {expandedRooms[room._id] && (
              <div className="room-channels">
                {room.channels.map(channel => (
                  <div 
                    key={channel._id}
                    className="channel-item"
                    onClick={() => {
                      // Navigate to channel
                      window.location.hash = `#/room/${room._id}/channel/${channel._id}`;
                    }}
                  >
                    <div className="channel-icon">
                      {channel.type === 'wishlist' && '心愿'}
                      {channel.type === 'mood' && '😊'}
                      {channel.type === 'music' && '🎵'}
                      {channel.type === 'planning' && '📅'}
                      {channel.type === 'tasks' && '✅'}
                      {channel.type === 'text' && '#'}
                    </div>
                    <div className="channel-name">{channel.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomNavigation;
```

### 2. Room Dashboard Component
```javascript
// src/components/RoomDashboard.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roomService } from '../services/roomService';
import SharedWishlist from './SharedWishlist';
import SharedMoodTracker from './SharedMoodTracker';
import SharedMusicPlayer from './SharedMusicPlayer';
import SharedTasks from './SharedTasks';

const RoomDashboard = () => {
  const { roomId, channelId } = useParams();
  const { user } = useAuth();
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        const roomData = await roomService.getRoom(roomId);
        setActiveRoom(roomData);
        
        if (channelId) {
          const channel = roomData.channels.find(c => c._id === channelId);
          setActiveChannel(channel);
        } else if (roomData.channels.length > 0) {
          setActiveChannel(roomData.channels[0]);
        }
      } catch (error) {
        console.error('Error loading room data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId && user) {
      loadRoomData();
    }
  }, [roomId, channelId, user]);

  if (loading) {
    return <div className="loading">Oda bilgileri yükleniyor...</div>;
  }

  if (!activeRoom) {
    return <div className="error">Oda bulunamadı</div>;
  }

  const renderChannelContent = () => {
    if (!activeChannel) {
      return (
        <div className="channel-placeholder">
          <h3>Oda Kuruluyor</h3>
          <p>Bu odada henüz kanal oluşturulmamış.</p>
        </div>
      );
    }

    switch (activeChannel.type) {
      case 'wishlist':
        return <SharedWishlist channelId={activeChannel._id} />;
      case 'mood':
        return <SharedMoodTracker channelId={activeChannel._id} />;
      case 'music':
        return <SharedMusicPlayer channelId={activeChannel._id} />;
      case 'tasks':
        return <SharedTasks channelId={activeChannel._id} />;
      case 'planning':
        return <SharedPlanning channelId={activeChannel._id} />;
      default:
        return (
          <div className="channel-placeholder">
            <h3>{activeChannel.name}</h3>
            <p>Bu kanal için içerik henüz hazır değil.</p>
          </div>
        );
    }
  };

  return (
    <div className="room-dashboard">
      <div className="room-header">
        <h1>{activeRoom.name}</h1>
        {activeRoom.description && (
          <p className="room-description">{activeRoom.description}</p>
        )}
      </div>
      
      <div className="room-content">
        <div className="channel-content">
          {renderChannelContent()}
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard;
```

### 3. Updated App Component with Room Integration
```javascript
// src/App.jsx (updated version)
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

// Import utility functions
import { calculateTimeDifference } from './utils/timeUtils'

// Import components
import CountdownTimer from './components/CountdownTimer'
import GiftBox from './components/GiftBox'
import Navigation from './components/Navigation'
import RoomNavigation from './components/RoomNavigation'
import RoomDashboard from './components/RoomDashboard'

// Import pages
import