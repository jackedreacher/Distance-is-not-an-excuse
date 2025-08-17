# Access Control and Permissions System

## Overview

This document outlines the access control and permissions system for the new room/channel architecture, ensuring secure and appropriate access to shared content while maintaining privacy and collaboration capabilities.

## Permission Model

### Role-Based Access Control (RBAC)

#### Roles
1. **Owner** - Creator of the room/channel, has all permissions
2. **Admin** - Can manage room/channel settings and members
3. **Member** - Can participate in room/channel activities
4. **Guest** - Limited access, typically for temporary collaboration

#### Permissions Structure
```javascript
// Permission definitions
const permissions = {
  // Room-level permissions
  room: {
    view: 'View room and its channels',
    manage: 'Manage room settings and members',
    delete: 'Delete the room'
  },
  
  // Channel-level permissions
  channel: {
    read: 'Read content in channel',
    write: 'Create and edit content',
    manage: 'Manage channel settings',
    delete: 'Delete channel content'
  },
  
  // Content-level permissions
  content: {
    view: 'View content items',
    create: 'Create new content items',
    edit: 'Edit existing content items',
    delete: 'Delete content items'
  }
};
```

### Permission Inheritance
```javascript
// Permission inheritance model
const permissionInheritance = {
  room: {
    owner: ['view', 'manage', 'delete'],
    admin: ['view', 'manage'],
    member: ['view'],
    guest: ['view']
  },
  channel: {
    owner: ['read', 'write', 'manage', 'delete'],
    admin: ['read', 'write', 'manage'],
    member: ['read', 'write'],
    guest: ['read']
  },
  content: {
    owner: ['view', 'create', 'edit', 'delete'],
    admin: ['view', 'create', 'edit'],
    member: ['view', 'create', 'edit'],
    guest: ['view']
  }
};
```

## Data Models for Permissions

### Permission Model
```javascript
// backend/src/models/Permission.js
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['room', 'channel', 'content'],
    required: true
  },
  permissions: [{
    type: String,
    enum: ['view', 'create', 'read', 'write', 'edit', 'delete', 'manage']
  }],
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  grantedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Index for efficient queries
permissionSchema.index({ userId: 1, resourceId: 1, resourceType: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
```

### Role Assignment Model
```javascript
// backend/src/models/RoleAssignment.js
const mongoose = require('mongoose');

const roleAssignmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['room', 'channel'],
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'member', 'guest'],
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Index for efficient queries
roleAssignmentSchema.index({ userId: 1, resourceId: 1, resourceType: 1 });

module.exports = mongoose.model('RoleAssignment', roleAssignmentSchema);
```

## Middleware for Permission Checking

### Room Access Middleware
```javascript
// backend/src/middleware/roomAccess.js
const Room = require('../models/Room');
const RoleAssignment = require('../models/RoleAssignment');

const checkRoomAccess = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Find room and verify user has access
    const room = await Room.findById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if user is a member of the room
    const roleAssignment = await RoleAssignment.findOne({
      userId,
      resourceId: roomId,
      resourceType: 'room'
    });

    if (!roleAssignment) {
      return res.status(403).json({ message: 'Access denied: Not a member of this room' });
    }

    req.room = room;
    req.userRole = roleAssignment.role;
    next();
  } catch (error) {
    console.error('Room access error:', error);
    res.status(500).json({
      message: 'Server error while checking room access',
      error: error.message
    });
  }
};

const requireRoomPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = permissionInheritance.room[req.userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Permission '${permission}' required for this action` 
      });
    }
    
    next();
  };
};

module.exports = {
  checkRoomAccess,
  requireRoomPermission
};
```

### Channel Access Middleware
```javascript
// backend/src/middleware/channelAccess.js
const Channel = require('../models/Channel');
const RoleAssignment = require('../models/RoleAssignment');

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
    const roomRoleAssignment = await RoleAssignment.findOne({
      userId,
      resourceId: channel.roomId._id,
      resourceType: 'room'
    });

    if (!roomRoleAssignment) {
      return res.status(403).json({ message: 'Access denied: Not a member of this room' });
    }

    // Check specific channel permissions
    const channelRoleAssignment = await RoleAssignment.findOne({
      userId,
      resourceId: channelId,
      resourceType: 'channel'
    });

    // If no specific channel role, inherit from room
    const effectiveRole = channelRoleAssignment ? 
      channelRoleAssignment.role : roomRoleAssignment.role;

    req.channel = channel;
    req.userRole = effectiveRole;
    next();
  } catch (error) {
    console.error('Channel access error:', error);
    res.status(500).json({
      message: 'Server error while checking channel access',
      error: error.message
    });
  }
};

const requireChannelPermission = (permission) => {
  return (req, res, next) => {
    const userPermissions = permissionInheritance.channel[req.userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Permission '${permission}' required for this action` 
      });
    }
    
    next();
  };
};

module.exports = {
  checkChannelAccess,
  requireChannelPermission
};
```

## Permission Management API

### Room Permission Controller
```javascript
// backend/src/controllers/roomPermissionController.js
const Room = require('../models/Room');
const RoleAssignment = require('../models/RoleAssignment');

// Grant role to user in room
exports.grantRole = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId, role } = req.body;

    // Verify requester has permission to grant roles
    const requesterRole = await RoleAssignment.findOne({
      userId: req.user._id,
      resourceId: roomId,
      resourceType: 'room'
    });

    if (!requesterRole || (requesterRole.role !== 'owner' && requesterRole.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions to grant roles' });
    }

    // Create or update role assignment
    const roleAssignment = await RoleAssignment.findOneAndUpdate(
      {
        userId,
        resourceId: roomId,
        resourceType: 'room'
      },
      {
        userId,
        resourceId: roomId,
        resourceType: 'room',
        role,
        assignedBy: req.user._id
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({ message: 'Role granted successfully', roleAssignment });
  } catch (error) {
    console.error('Grant role error:', error);
    res.status(500).json({
      message: 'Server error while granting role',
      error: error.message
    });
  }
};

// Revoke role from user in room
exports.revokeRole = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    // Verify requester has permission to revoke roles
    const requesterRole = await RoleAssignment.findOne({
      userId: req.user._id,
      resourceId: roomId,
      resourceType: 'room'
    });

    if (!requesterRole || (requesterRole.role !== 'owner' && requesterRole.role !== 'admin')) {
      return res.status(403).json({ message: 'Insufficient permissions to revoke roles' });
    }

    // Cannot revoke owner role unless requester is owner
    const targetRole = await RoleAssignment.findOne({
      userId,
      resourceId: roomId,
      resourceType: 'room'
    });

    if (targetRole.role === 'owner' && requesterRole.role !== 'owner') {
      return res.status(403).json({ message: 'Only owners can revoke owner roles' });
    }

    // Remove role assignment
    await RoleAssignment.deleteOne({
      userId,
      resourceId: roomId,
      resourceType: 'room'
    });

    res.json({ message: 'Role revoked successfully' });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({
      message: 'Server error while revoking role',
      error: error.message
    });
  }
};

// Get room members and their roles
exports.getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;

    const roleAssignments = await RoleAssignment.find({
      resourceId: roomId,
      resourceType: 'room'
    }).populate('userId', 'username profile.name profile.gender');

    res.json(roleAssignments);
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({
      message: 'Server error while fetching room members',
      error: error.message
    });
  }
};
```

### Channel Permission Controller
```javascript
// backend/src/controllers/channelPermissionController.js
const Channel = require('../models/Channel');
const RoleAssignment = require('../models/RoleAssignment');

// Grant role to user in channel
exports.grantChannelRole = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { userId, role } = req.body;

    // Verify requester has permission to grant roles
    const requesterRole = await RoleAssignment.findOne({
      userId: req.user._id,
      resourceId: channelId,
      resourceType: 'channel'
    });

    // If no specific channel role, check room role
    const channel = await Channel.findById(channelId);
    const roomRole = await RoleAssignment.findOne({
      userId: req.user._id,
      resourceId: channel.roomId,
      resourceType: 'room'
    });

    if (!requesterRole && (!roomRole || roomRole.role !== 'owner')) {
      return res.status(403).json({ message: 'Insufficient permissions to grant channel roles' });
    }

    // Create or update role assignment
    const roleAssignment = await RoleAssignment.findOneAndUpdate(
      {
        userId,
        resourceId: channelId,
        resourceType: 'channel'
      },
      {
        userId,
        resourceId: channelId,
        resourceType: 'channel',
        role,
        assignedBy: req.user._id
      },
      {
        upsert: true,
        new: true
      }
    );

    res.json({ message: 'Channel role granted successfully', roleAssignment });
  } catch (error) {
    console.error('Grant channel role error:', error);
    res.status(500).json({
      message: 'Server error while granting channel role',
      error: error.message
    });
  }
};

// Get channel members and their roles
exports.getChannelMembers = async (req, res) => {
  try {
    const { channelId } = req.params;

    const roleAssignments = await RoleAssignment.find({
      resourceId: channelId,
      resourceType: 'channel'
    }).populate('userId', 'username profile.name profile.gender');

    res.json(roleAssignments);
  } catch (error) {
    console.error('Get channel members error:', error);
    res.status(500).json({
      message: 'Server error while fetching channel members',
      error: error.message
    });
  }
};
```

## Frontend Permission Handling

### Permission Context
```javascript
// src/contexts/PermissionContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { permissionService } from '../services/permissionService';

const PermissionContext = createContext();

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user) {
        setPermissions({});
        return;
      }

      try {
        setLoading(true);
        const userPermissions = await permissionService.getUserPermissions(user._id);
        setPermissions(userPermissions);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user]);

  const hasPermission = (resourceId, permission) => {
    if (!permissions[resourceId]) {
      return false;
    }
    
    return permissions[resourceId].includes(permission);
  };

  const getUserRole = (resourceId) => {
    // Implementation to get user role for specific resource
    return permissions[resourceId]?.role || 'guest';
  };

  const value = {
    permissions,
    loading,
    hasPermission,
    getUserRole
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
```

### Protected Component Wrapper
```javascript
// src/components/ProtectedComponent.jsx
import { usePermission } from '../contexts/PermissionContext';

const ProtectedComponent = ({ resourceId, permission, children, fallback = null }) => {
  const { hasPermission } = usePermission();

  if (!hasPermission(resourceId, permission)) {
    return fallback;
  }

  return children;
};

export default ProtectedComponent;
```

## Security Considerations

### 1. Data Privacy
```javascript
// Ensure sensitive data is not exposed
const sanitizeUser = (user) => {
  const { password, email, ...safeUser } = user.toObject();
  return safeUser;
};
```

### 2. Input Validation
```javascript
// Validate permission inputs
const validatePermissionInput = (input) => {
  const validRoles = ['owner', 'admin', 'member', 'guest'];
  const validPermissions = ['view', 'create', 'read', 'write', 'edit', 'delete', 'manage'];
  
  if (!validRoles.includes(input.role)) {
    throw new Error('Invalid role');
  }
  
  if (input.permissions && !input.permissions.every(p => validPermissions.includes(p))) {
    throw new Error('Invalid permissions');
  }
};
```

### 3. Audit Logging
```javascript
// Log permission changes for security audit
const logPermissionChange = async (action, userId, resourceId, resourceType, details) => {
  const auditLog = new AuditLog({
    action,
    userId,
    resourceId,
    resourceType,
    details,
    timestamp: new Date()
  });
  
  await auditLog.save();
};
```

## Conclusion

The access control and permissions system provides a robust framework for managing user access to rooms, channels, and content. With role-based access control, inheritance models, and comprehensive middleware, the system ensures that only authorized users can access and modify shared content while maintaining the privacy and security that couples expect in their personal digital spaces.