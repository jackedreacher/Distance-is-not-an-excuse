# Data Models for New Features

## Overview

This document outlines the data models required for implementing Discord-like features in the romantic couple's application. It covers message models, presence tracking, voice/video calling, server/channel structures, and other related entities.

## Message System Models

### Message Model
```javascript
// backend/src/models/Message.js
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
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel'
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice', 'file', 'system'],
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
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    url: {
      type: String,
      required: true
    },
    name: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
messageSchema.index({ channelId: 1, createdAt: -1 });
messageSchema.index({ createdAt: 1 }); // For cleanup

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Set delivered timestamp if not already set
  if (this.isModified('delivered') && this.delivered && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  // Set read timestamp if not already set
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Message', messageSchema);
```

### Conversation Model
```javascript
// backend/src/models/Conversation.js
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageId: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
```

## Presence and Activity Models

### Presence Model
```javascript
// backend/src/models/Presence.js
const mongoose = require('mongoose');

const presenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy', 'invisible'],
    default: