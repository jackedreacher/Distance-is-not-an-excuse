# Server and Channel Structure for Romantic Couple's App

## Overview

This document outlines the server and channel structure for the romantic couple's application. Unlike traditional Discord servers with multiple users and complex hierarchies, this implementation will focus on a private, intimate space for just two people - the couple.

## Server Structure

### Private Couple Server

Since this is a dedicated application for a romantic couple, we'll implement a simplified server structure:

1. **Single Private Server**: Each couple will have one private server that only they can access
2. **No Public Servers**: No public or shared servers will be available
3. **Partner-Only Access**: Only the two partners can join the server

#### Server Features

- **Custom Server Name**: Couples can name their private server (e.g., "Our Love Nest", "Forever Together")
- **Custom Server Icon**: Upload a special image for the server
- **Partner Roles**: Both partners have equal permissions by default
- **Privacy Controls**: Server is completely private with no external access

### Server Data Model

```javascript
// backend/src/models/Server.js
const mongoose = require('mongoose');

const serverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  icon: {
    type: String, // URL to server icon
    default: ''
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
serverSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Server', serverSchema);
```

## Channel Structure

### Channel Types

1. **Text Channels**: For general messaging and conversation
2. **Voice Channels**: For voice calls between partners
3. **Private Notes**: Encrypted private notes that only one partner can see
4. **Shared Journal**: A collaborative journal both partners can contribute to

#### Default Channels

Each server will have these default channels:

1. **#general** - Main text channel for daily conversations
2. **#memories** - Channel for sharing photos and memories
3. **#planning** - Channel for planning dates and activities
4. **#vent** - Private space for sharing frustrations or concerns
5. **Voice Channel** - For voice calls

### Channel Data Model

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
    enum: ['text', 'voice', 'notes', 'journal'],
    default: 'text'
  },
  serverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Server',
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
    default: false // For private notes
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

// Auto-update timestamp
channelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Channel', channelSchema);
```

## Implementation Plan

### 1. Backend Implementation

#### Server Controller (`backend/src/controllers/servers.js`)
```javascript
const Server = require('../models/Server');
const Channel = require('../models/Channel');
const User = require('../models/User');

// Create a new server for a couple
exports.createServer = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.user._id;

    // Get user's partner
    const user = await User.findById(userId).populate('partnerId');
    if (!user || !user.partnerId) {
      return res.status(400).json({ message: 'User must have a partner to create a server' });
    }

    // Check if server already exists for this couple
    const existingServer = await Server.findOne({
      members: { $all: [userId, user.partnerId._id] }
    });

    if (existingServer) {
      return res.status(400).json({ message: 'Server already exists for this couple' });
    }

    // Create new server
    const newServer = new Server({
      name: name || `${user.username} & ${user.partnerId.username}'s Space`,
      icon: icon || '',
      ownerId: userId,
      members: [userId, user.partnerId._id]
    });

    await newServer.save();

    // Create default channels
    const defaultChannels = [
      { name: 'general', type: 'text', topic: 'General conversation' },
      { name: 'memories', type: 'text', topic: 'Share photos and memories' },
      { name: 'planning', type: 'text', topic: 'Plan dates and activities' },
      { name: 'vent', type: 'text', topic: 'Private space for concerns' },
      { name: 'Voice Chat', type: 'voice', topic: 'Voice calls' }
    ];

    const channels = await Promise.all(
      defaultChannels.map(async (channelData, index) => {
        const channel = new Channel({
          ...channelData,
          serverId: newServer._id,
          position: index
        });
        return await channel.save();
      })
    );

    res.status(201).json({
      server: newServer,
      channels: channels
    });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({
      message: 'Server error while creating server',
      error: error.message
    });
  }
};

// Get server information
exports.getServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    // Verify user is a member of the server
    const server = await Server.findOne({
      _id: serverId,
      members: userId
    }).populate('members', 'username profile.name profile.gender');

    if (!server) {
      return res.status(404).json({ message: 'Server not found or access denied' });
    }

    // Get channels for this server
    const channels = await Channel.find({ serverId: server._id }).sort('position');

    res.json({
      server,
      channels
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({
      message: 'Server error while fetching server',
      error: error.message
    });
  }
};

// Update server settings
exports.updateServer = async (req, res) => {
  try {
    const { serverId } = req.params;
    const { name, icon } = req.body;
    const userId = req.user._id;

    // Verify user is the owner of the server
    const server = await Server.findOne({
      _id: serverId,
      ownerId: userId
    });

    if (!server) {
      return res.status(403).json({ message: 'Access denied: Only server owner can update settings' });
    }

    // Update server
    server.name = name || server.name;
    server.icon = icon !== undefined ? icon : server.icon;

    await server.save();

    res.json(server);
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({
      message: 'Server error while updating server',
      error: error.message
    });
  }
};
```

#### Channel Controller (`backend/src/controllers/channels.js`)
```javascript
const Channel = require('../models/Channel');
const Server = require('../models/Server');

// Create a new channel
exports.createChannel = async (req, res) => {
  try {
    const { serverId, name, type, topic, isPrivate } = req.body;
    const userId = req.user._id;

    // Verify user is a member of the server
    const server = await Server.findOne({
      _id: serverId,
      members: userId
    });

    if (!server) {
      return res.status(403).json({ message: 'Access denied: Not a member of this server' });
    }

    // Get the highest position for this server
    const highestPositionChannel = await Channel.findOne({ serverId })
      .sort('-position')
      .select('position');

    const newPosition = highestPositionChannel ? highestPositionChannel.position + 1 : 0;

    // Create new channel
    const newChannel = new Channel({
      name,
      type: type || 'text',
      serverId,
      topic: topic || '',
      isPrivate: isPrivate || false,
      position: newPosition
    });

    await newChannel.save();

    res.status(201).json(newChannel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({
      message: 'Server error while creating channel',
      error: error.message
    });
  }
};

// Get channels for a server
exports.getServerChannels = async (req, res) => {
  try {
    const { serverId } = req.params;
    const userId = req.user._id;

    // Verify user is a member of the server
    const server = await Server.findOne({
      _id: serverId,
      members: userId
    });

    if (!server) {
      return res.status(403).json({ message: 'Access denied: Not a member of this server' });
    }

    // Get channels for this server
    const channels = await Channel.find({ serverId }).sort('position');

    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({
      message: 'Server error while fetching channels',
      error: error.message
    });
  }
};

// Update channel
exports.updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { name, topic } = req.body;
    const userId = req.user._id;

    // Find channel and verify user has access
    const channel = await Channel.findById(channelId).populate({
      path: 'serverId',
      select: 'members ownerId'
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Verify user is a member of the server
    const isMember = channel.serverId.members.some(member => 
      member.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: 'Access denied: Not a member of this server' });
    }

    // Update channel
    channel.name = name || channel.name;
    channel.topic = topic !== undefined ? topic : channel.topic;

    await channel.save();

    res.json(channel);
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({
      message: 'Server error while updating channel',
      error: error.message
    });
  }
};

// Delete channel
exports.deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user._id;

    // Find channel and verify user has access
    const channel = await Channel.findById(channelId).populate({
      path: 'serverId',
      select: 'members ownerId'
    });

    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Verify user is the owner of the server
    if (channel.serverId.ownerId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied: Only server owner can delete channels' });
    }

    // Don't allow deletion of default channels
    const defaultChannels = ['general', 'memories', 'planning', 'vent'];
    if (defaultChannels.includes(channel.name)) {
      return res.status(400).json({ message: 'Cannot delete default channels' });
    }

    // Delete channel
    await Channel.findByIdAndDelete(channelId);

    res.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      message: 'Server error while deleting channel',
      error: error.message
    });
  }
};
```

#### Server Routes (`backend/src/routes/servers.js`)
```javascript
const express = require('express');
const router = express.Router();
const serverController = require('../controllers/servers');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new server
router.post('/', serverController.createServer);

// Get server information
router.get('/:serverId', serverController.getServer);

// Update server settings
router.put('/:serverId', serverController.updateServer);

module.exports = router;
```

#### Channel Routes (`backend/src/routes/channels.js`)
```javascript
const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channels');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new channel
router.post('/', channelController.createChannel);

// Get channels for a server
router.get('/server/:serverId', channelController.getServerChannels);

// Update channel
router.put('/:channelId', channelController.updateChannel);

// Delete channel
router.delete('/:channelId', channelController.deleteChannel);

module.exports = router;
```

### 2. Frontend Implementation

#### Server Service (`src/services/serverService.js`)
```javascript
import { API_BASE_URL } from './api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const serverService = {
  createServer: async (serverData) => {
    const response = await fetch(`${API_BASE_URL}/servers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serverData)
    });
    return response.json();
  },

  getServer: async (serverId) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateServer: async (serverId, serverData) => {
    const response = await fetch(`${API_BASE_URL}/servers/${serverId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(serverData)
    });
    return response.json();
  }
};

export const channelService = {
  createChannel: async (channelData) => {
    const response = await fetch(`${API_BASE_URL}/channels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(channelData)
    });
    return response.json();
  },

  getServerChannels: async (serverId) => {
    const response = await fetch(`${API_BASE_URL}/channels/server/${serverId}`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateChannel: async (channelId, channelData) => {
    const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(channelData)
    });
    return response.json();
  },

  deleteChannel: async (channelId) => {
    const response = await fetch(`${API_BASE_URL}/channels/${channelId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};
```

#### Server Context (`src/contexts/ServerContext.jsx`)
```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { serverService, channelService } from '../services/serverService';

const ServerContext = createContext();

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};

export const ServerProvider = ({ children }) => {
  const [server, setServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // Load server and channels when user is available
  useEffect(() => {
    if (user) {
      loadServer();
    }
  }, [user]);

  const loadServer = async () => {
    try {
      setLoading(true);
      setError('');

      // In a real implementation, you would fetch the existing server
      // For now, we'll assume the server exists and fetch it
      // You might need to create a server if one doesn't exist
      const serverData = await serverService.getServer('server-id-placeholder');
      setServer(serverData.server);
      setChannels(serverData.channels);
    } catch (err) {
      console.error('Error loading server:', err);
      setError('Failed to load server data');
    } finally {
      setLoading(false);
    }
  };

  const createServer = async (serverData) => {
    try {
      const data = await serverService.createServer(serverData);
      setServer(data.server);
      setChannels(data.channels);
      return data;
    } catch (err) {
      console.error('Error creating server:', err);
      setError('Failed to create server');
      throw err;
    }
  };

  const updateServer = async (serverData) => {
    try {
      const updatedServer = await serverService.updateServer(server._id, serverData);
      setServer(updatedServer);
      return updatedServer;
    } catch (err) {
      console.error('Error updating server:', err);
      setError('Failed to update server');
      throw err;
    }
  };

  const loadChannels = async (serverId) => {
    try {
      const channelData = await channelService.getServerChannels(serverId);
      setChannels(channelData);
      return channelData;
    } catch (err) {
      console.error('Error loading channels:', err);
      setError('Failed to load channels');
      throw err;
    }
  };

  const createChannel = async (channelData) => {
    try {
      const newChannel = await channelService.createChannel(channelData);
      setChannels(prev => [...prev, newChannel]);
      return newChannel;
    } catch (err) {
      console.error('Error creating channel:', err);
      setError('Failed to create channel');
      throw err;
    }
  };

  const updateChannel = async (channelId, channelData) => {
    try {
      const updatedChannel = await channelService.updateChannel(channelId, channelData);
      setChannels(prev => 
        prev.map(channel => 
          channel._id === channelId ? updatedChannel : channel
        )
      );
      return updatedChannel;
    } catch (err) {
      console.error('Error updating channel:', err);
      setError('Failed to update channel');
      throw err;
    }
  };

  const deleteChannel = async (channelId) => {
    try {
      await channelService.deleteChannel(channelId);
      setChannels(prev => prev.filter(channel => channel._id !== channelId));
    } catch (err) {
      console.error('Error deleting channel:', err);
      setError('Failed to delete channel');
      throw err;
    }
  };

  const value = {
    server,
    channels,
    loading,
    error,
    createServer,
    updateServer,
    loadChannels,
    createChannel,
    updateChannel,
    deleteChannel
  };

  return (
    <ServerContext.Provider value={value}>
      {children}
    </ServerContext.Provider>
  );
};
```

#### Server UI Components

##### Server Header Component (`src/components/ServerHeader.jsx`)
```javascript
import { useServer } from '../contexts/ServerContext';

const ServerHeader = () => {
  const { server } = useServer();

  if (!server) return null;

  return (
    <div className="server-header">
      <div className="server-icon">
        {server.icon ? (
          <img src={server.icon} alt={server.name} />
        ) : (
          <div className="server-icon-placeholder">
            {server.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="server-info">
        <h1 className="server-name">{server.name}</h1>
        <p className="server-members">
          {server.members.length} member{server.members.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};

export default ServerHeader;
```

##### Channel List Component (`src/components/ChannelList.jsx`)
```javascript
import { useServer } from '../contexts/ServerContext';

const ChannelList = () => {
  const { channels, server } = useServer();

  if (!server) return null;

  const textChannels = channels.filter(channel => channel.type === 'text');
  const voiceChannels = channels.filter(channel => channel.type === 'voice');
  const noteChannels = channels.filter(channel => channel.type === 'notes' || channel.type === 'journal');

  return (
    <div className="channel-list">
      <div className="channel-category">
        <h3 className="channel-category-title">TEXT CHANNELS</h3>
        {textChannels.map(channel => (
          <div key={channel._id} className="channel-item">
            <span className="channel-icon">#</span>
            <span className="channel-name">{channel.name}</span>
          </div>
        ))}
      </div>

      {voiceChannels.length > 0 && (
        <div className="channel-category">
          <h3 className="channel-category-title">VOICE CHANNELS</h3>
          {voiceChannels.map(channel => (
            <div key={channel._id} className="channel-item">
              <span className="channel-icon">🔊</span>
              <span className="channel-name">{channel.name}</span>
            </div>
          ))}
        </div>
      )}

      {noteChannels.length > 0 && (
        <div className="channel-category">
          <h3 className="channel-category-title">NOTES & JOURNALS</h3>
          {noteChannels.map(channel => (
            <div key={channel._id} className="channel-item">
              <span className="channel-icon">📝</span>
              <span className="channel-name">{channel.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChannelList;
```

##### Server Settings Component (`src/components/ServerSettings.jsx`)
```javascript
import { useState } from 'react';
import { useServer } from '../contexts/ServerContext';

const ServerSettings = () => {
  const { server, updateServer } = useServer();
  const [serverName, setServerName] = useState(server?.name || '');
  const [serverIcon, setServerIcon] = useState(server?.icon || '');

  const handleSave = async () => {
    try {
      await updateServer({
        name: serverName,
        icon: serverIcon
      });
      // Show success message
    } catch (error) {
      // Show error message
    }
  };

  if (!server) return null;

  return (
    <div className="server-settings">
      <h2>Server Settings</h2>
      
      <div className="settings-group">
        <label htmlFor="server-name">Server Name</label>
        <input
          id="server-name"
          type="text"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="Enter server name"
        />
      </div>

      <div className="settings-group">
        <label htmlFor="server-icon">Server Icon URL</label>
        <input
          id="server-icon"
          type="text"
          value={serverIcon}
          onChange={(e) => setServerIcon(e.target.value)}
          placeholder="Enter icon URL"
        />
      </div>

      <button onClick={handleSave} className="save-button">
        Save Changes
      </button>
    </div>
  );
};

export default ServerSettings;
```

## Integration with Existing App

### Navigation Integration

Update the navigation to include server access:

```javascript
// In Navigation.jsx
import { useServer } from '../contexts/ServerContext';

const Navigation = () => {
  const { server } = useServer();
  
  // Add server link to navigation
  const navItems = [
    // ... existing items
    { path: '/server', label: '💬 Our Space' }
  ];

  // ... rest of navigation component
};
```

### Server Page (`src/pages/ServerPage.jsx`)
```javascript
import { useState } from 'react';
import ServerHeader from '../components/ServerHeader';
import ChannelList from '../components/ChannelList';
import ServerSettings from '../components/ServerSettings';

const ServerPage = () => {
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' or 'settings'

  return (
    <div className="server-page">
      <ServerHeader />
      
      <div className="server-content">
        <div className="server-sidebar">
          <div className="server-tabs">
            <button 
              className={`tab-button ${activeTab === 'channels' ? 'active' : ''}`}
              onClick={() => setActiveTab('channels')}
            >
              Channels
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
          
          {activeTab === 'channels' ? <ChannelList /> : <ServerSettings />}
        </div>
        
        <div className="server-main">
          {/* Channel content will be displayed here */}
          <div className="channel-placeholder">
            <p>Select a channel to start chatting!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerPage;
```

## Security Considerations

1. **Server Ownership**: Only the server owner can delete channels or change server settings
2. **Member Verification**: All channel access is verified against server membership
3. **Private Channels**: Special handling for private notes that only one partner can access
4. **Data Encryption**: Sensitive data like private notes should be encrypted
5. **Rate Limiting**: Prevent abuse of channel creation/deletion endpoints

## Performance Considerations

1. **Caching**: Cache server and channel data to reduce API calls
2. **Pagination**: For channels with many messages, implement pagination
3. **Lazy Loading**: Load channel content only when selected
4. **WebSocket Integration**: Use WebSockets for real-time channel updates

## Future Enhancements

1. **Channel Categories**: Group channels into custom categories
2. **Channel Permissions**: Fine-grained permissions for different channel types
3. **Channel Invites**: Temporary invites for special occasions
4. **Channel Bots**: Custom bots for reminders, celebrations, etc.
5. **Channel Analytics**: Insights into channel usage and activity