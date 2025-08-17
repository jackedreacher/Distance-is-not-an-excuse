# Voice/Video Calling Capabilities

## Overview

This document outlines the implementation plan for voice and video calling capabilities in the romantic couple's application. These features will enhance the Discord-like experience by enabling real-time audio and video communication between partners.

## Technology Selection

For voice/video calling, we'll use WebRTC (Web Real-Time Communication) with a signaling server. WebRTC is the standard for real-time communication in web browsers and provides:

1. **Peer-to-Peer Communication**: Direct connection between users for low latency
2. **Browser Support**: Native support in modern browsers
3. **Security**: Built-in encryption (DTLS-SRTP)
4. **Scalability**: No media servers required for 1:1 calls

## Architecture Components

### 1. Signaling Server

The signaling server facilitates the initial connection setup between peers. We'll extend our existing Socket.IO implementation for this purpose.

#### Signaling Events

```javascript
// Backend signaling events (backend/src/config/socket.js)
socket.on('callUser', (data) => {
  // Initiate a call to another user
  socket.to(data.userToCall).emit('callUser', {
    signal: data.signalData,
    from: data.from,
    name: data.name
  });
});

socket.on('answerCall', (data) => {
  // Answer an incoming call
  socket.to(data.to).emit('callAccepted', data.signal);
});

socket.on('endCall', (data) => {
  // End the current call
  socket.to(data.userToCall).emit('callEnded');
});

socket.on('iceCandidate', (data) => {
  // Exchange ICE candidates for connection
  socket.to(data.to).emit('iceCandidate', data.candidate);
});
```

### 2. Frontend Implementation

#### Calling Service (`src/services/calling.js`)

```javascript
import io from 'socket.io-client';
import Peer from 'simple-peer';

class CallingService {
  constructor() {
    this.socket = null;
    this.peer = null;
    this.user = null;
    this.partner = null;
  }

  initialize(user, partner) {
    this.user = user;
    this.partner = partner;
    
    // Connect to Socket.IO server
    this.socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    // Set up socket event listeners
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    this.socket.on('callUser', (data) => {
      // Handle incoming call
      this.handleIncomingCall(data);
    });

    this.socket.on('callAccepted', (signal) => {
      // Handle call acceptance
      this.peer.signal(signal);
    });

    this.socket.on('callEnded', () => {
      // Handle call end
      this.endCall();
    });

    this.socket.on('iceCandidate', (candidate) => {
      // Handle ICE candidate
      if (this.peer) {
        this.peer.signal(candidate);
      }
    });
  }

  callPartner(partnerId, stream) {
    return new Promise((resolve, reject) => {
      // Create peer connection
      this.peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      this.setupPeerListeners(resolve, reject);

      // Signal the partner
      this.peer.on('signal', (data) => {
        this.socket.emit('callUser', {
          userToCall: partnerId,
          signalData: data,
          from: this.user._id,
          name: this.user.username
        });
      });
    });
  }

  answerCall(incomingCallData, stream) {
    return new Promise((resolve, reject) => {
      // Create peer connection
      this.peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      this.setupPeerListeners(resolve, reject);

      // Signal back to caller
      this.peer.signal(incomingCallData.signal);
    });
  }

  setupPeerListeners(resolve, reject) {
    this.peer.on('stream', (stream) => {
      // Received partner's stream
      resolve(stream);
    });

    this.peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      reject(err);
    });

    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.endCall();
    });
  }

  endCall() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    
    if (this.socket) {
      this.socket.emit('endCall', {
        userToCall: this.partner._id
      });
    }
  }

  cleanup() {
    this.endCall();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new CallingService();
```

#### Calling Component (`src/components/Calling.jsx`)

```javascript
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import callingService from '../services/calling';

const Calling = () => {
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, incoming, active, ending
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [partnerStream, setPartnerStream] = useState(null);
  const [mediaDevices, setMediaDevices] = useState({
    audio: true,
    video: true
  });
  
  const localVideoRef = useRef(null);
  const partnerVideoRef = useRef(null);
  const { user } = useAuth();
  const { socket } = useSocket();

  // Initialize calling service
  useEffect(() => {
    if (user && socket) {
      callingService.initialize(user, null); // Partner will be set when calling
    }

    return () => {
      callingService.cleanup();
    };
  }, [user, socket]);

  // Set up socket listeners for calling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      setIncomingCall(data);
      setCallStatus('incoming');
    };

    const handleCallEnded = () => {
      endCall();
    };

    socket.on('callUser', handleIncomingCall);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('callUser', handleIncomingCall);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket]);

  // Set up video streams
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    if (partnerStream && partnerVideoRef.current) {
      partnerVideoRef.current.srcObject = partnerStream;
    }
  }, [localStream, partnerStream]);

  // Get user media
  const getMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: mediaDevices.audio,
        video: mediaDevices.video ? { facingMode: 'user' } : false
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      throw error;
    }
  };

  // Start a call
  const startCall = async (partnerId) => {
    try {
      setCallStatus('calling');
      
      // Get media stream
      const stream = await getMediaStream();
      
      // Initialize calling service with partner
      callingService.partner = { _id: partnerId };
      
      // Start the call
      const partnerStream = await callingService.callPartner(partnerId, stream);
      setPartnerStream(partnerStream);
      setCallStatus('active');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('idle');
    }
  };

  // Answer incoming call
  const answerCall = async () => {
    try {
      setCallStatus('active');
      
      // Get media stream
      const stream = await getMediaStream();
      
      // Answer the call
      const partnerStream = await callingService.answerCall(incomingCall, stream);
      setPartnerStream(partnerStream);
    } catch (error) {
      console.error('Error answering call:', error);
      setCallStatus('idle');
    }
  };

  // End the current call
  const endCall = () => {
    callingService.endCall();
    
    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    setPartnerStream(null);
    setCallStatus('idle');
    setIncomingCall(null);
  };

  // Toggle audio/video
  const toggleMedia = async (type) => {
    if (!localStream) return;

    const track = localStream.getTracks().find(track => 
      type === 'audio' ? track.kind === 'audio' : track.kind === 'video'
    );

    if (track) {
      track.enabled = !track.enabled;
      setMediaDevices(prev => ({
        ...prev,
        [type]: track.enabled
      }));
    }
  };

  // Render calling interface based on status
  const renderCallingInterface = () => {
    switch (callStatus) {
      case 'calling':
        return (
          <div className="calling-screen">
            <h2>{incomingCall?.name || 'Partner'} aranıyor...</h2>
            <div className="calling-spinner">📞</div>
            <button onClick={endCall} className="call-button end">
              Aramayı İptal Et
            </button>
          </div>
        );

      case 'incoming':
        return (
          <div className="incoming-call-screen">
            <h2>Gelen Arama</h2>
            <h3>{incomingCall?.name || 'Partner'} arıyor</h3>
            <div className="caller-avatar">👤</div>
            <div className="call-actions">
              <button onClick={answerCall} className="call-button accept">
                📞 Kabul Et
              </button>
              <button onClick={endCall} className="call-button reject">
                📴 Reddet
              </button>
            </div>
          </div>
        );

      case 'active':
        return (
          <div className="active-call-screen">
            {/* Partner video */}
            <div className="partner-video-container">
              <video 
                ref={partnerVideoRef} 
                autoPlay 
                playsInline 
                className="partner-video"
              />
              <div className="partner-name">
                {incomingCall?.name || 'Partner'}
              </div>
            </div>

            {/* Local video (picture-in-picture) */}
            <div className="local-video-container">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted
                className="local-video"
              />
            </div>

            {/* Call controls */}
            <div className="call-controls">
              <button 
                onClick={() => toggleMedia('audio')}
                className={`control-button ${mediaDevices.audio ? 'active' : 'muted'}`}
              >
                {mediaDevices.audio ? '🔊' : '🔇'}
              </button>
              
              <button 
                onClick={() => toggleMedia('video')}
                className={`control-button ${mediaDevices.video ? 'active' : 'off'}`}
              >
                {mediaDevices.video ? '📹' : '📷'}
              </button>
              
              <button onClick={endCall} className="control-button end">
                📴
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="call-initiation">
            <h2>Sesli/Video Arama</h2>
            <div className="call-options">
              <button 
                onClick={() => startCall(partnerId)} 
                className="call-button voice"
              >
                📞 Sesli Arama
              </button>
              <button 
                onClick={() => startCall(partnerId)} 
                className="call-button video"
              >
                📹 Video Arama
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="calling-container">
      {renderCallingInterface()}
    </div>
  );
};

export default Calling;
```

### 3. Call History and Logging

#### Call Model (`backend/src/models/Call.js`)

```javascript
const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callType: {
    type: String,
    enum: ['voice', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'connected', 'ended', 'missed', 'declined'],
    default: 'initiated'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
callSchema.index({ callerId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Call', callSchema);
```

#### Call Controller (`backend/src/controllers/calls.js`)

```javascript
const Call = require('../models/Call');
const User = require('../models/User');

// Log a new call
exports.logCall = async (req, res) => {
  try {
    const { receiverId, callType, status, startTime, endTime } = req.body;
    const callerId = req.user._id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Calculate duration if both times are provided
    let duration = 0;
    if (startTime && endTime) {
      duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    }

    // Create call log
    const newCall = new Call({
      callerId,
      receiverId,
      callType,
      status,
      startTime,
      endTime,
      duration
    });

    await newCall.save();

    res.status(201).json(newCall);
  } catch (error) {
    console.error('Log call error:', error);
    res.status(500).json({
      message: 'Server error while logging call',
      error: error.message
    });
  }
};

// Get call history
exports.getCallHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    // Get calls where user is either caller or receiver
    const calls = await Call.find({
      $or: [
        { callerId: userId },
        { receiverId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('callerId', 'username profile.name')
    .populate('receiverId', 'username profile.name');

    res.json(calls);
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      message: 'Server error while fetching call history',
      error: error.message
    });
  }
};

// Get recent missed calls
exports.getMissedCalls = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get missed calls where user is the receiver
    const missedCalls = await Call.find({
      receiverId: userId,
      status: 'missed'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('callerId', 'username profile.name');

    res.json(missedCalls);
  } catch (error) {
    console.error('Get missed calls error:', error);
    res.status(500).json({
      message: 'Server error while fetching missed calls',
      error: error.message
    });
  }
};
```

#### Call Routes (`backend/src/routes/calls.js`)

```javascript
const express = require('express');
const router = express.Router();
const callController = require('../controllers/calls');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Log a new call
router.post('/', callController.logCall);

// Get call history
router.get('/history', callController.getCallHistory);

// Get missed calls
router.get('/missed', callController.getMissedCalls);

module.exports = router;
```

### 4. Frontend Call History Component

#### Call History Component (`src/components/CallHistory.jsx`)

```javascript
import { useState, useEffect } from 'react';
import { callService } from '../services/api';

const CallHistory = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [missedCalls, setMissedCalls] = useState([]);

  useEffect(() => {
    loadCallHistory();
    loadMissedCalls();
  }, []);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const data = await callService.getCallHistory();
      setCalls(data);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMissedCalls = async () => {
    try {
      const data = await callService.getMissedCalls();
      setMissedCalls(data);
    } catch (error) {
      console.error('Error loading missed calls:', error);
    }
  };

  const formatCallType = (type) => {
    return type === 'video' ? '📹 Video' : '📞 Ses';
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} saniye`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return '✅';
      case 'missed': return '❌';
      case 'declined': return '🚫';
      default: return '📞';
    }
  };

  if (loading) {
    return <div className="loading">Arama geçmişi yükleniyor...</div>;
  }

  return (
    <div className="call-history-container">
      <h2>📞 Arama Geçmişi</h2>
      
      {missedCalls.length > 0 && (
        <div className="missed-calls-section">
          <h3>Kaçırılan Aramalar</h3>
          <div className="missed-calls-list">
            {missedCalls.map(call => (
              <div key={call._id} className="missed-call-item">
                <div className="call-info">
                  <span className="caller-name">
                    {call.callerId?.profile?.name || call.callerId?.username}
                  </span>
                  <span className="call-time">
                    {formatTime(call.createdAt)}
                  </span>
                </div>
                <div className="call-type">
                  {formatCallType(call.callType)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="call-history-list">
        {calls.map(call => (
          <div key={call._id} className="call-history-item">
            <div className="call-icon">
              {getStatusIcon(call.status)}
            </div>
            <div className="call-details">
              <div className="caller-info">
                <span className="caller-name">
                  {call.callerId?._id === user._id 
                    ? 'Sen' 
                    : (call.callerId?.profile?.name || call.callerId?.username)}
                </span>
                <span className="call-time">
                  {formatTime(call.createdAt)}
                </span>
              </div>
              <div className="call-meta">
                <span className="call-type">
                  {formatCallType(call.callType)}
                </span>
                {call.duration > 0 && (
                  <span className="call-duration">
                    {formatDuration(call.duration)}
                  </span>
                )}
                <span className={`call-status ${call.status}`}>
                  {call.status === 'connected' ? 'Bağlandı' : 
                   call.status === 'missed' ? 'Cevapsız' : 
                   call.status === 'declined' ? 'Reddedildi' : 'Tamamlandı'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallHistory;
```

## Implementation Steps

1. **Backend Setup**:
   - Install required dependencies (peer.js for signaling)
   - Create call model and controller
   - Add call routes to the backend

2. **Frontend Setup**:
   - Install WebRTC libraries (simple-peer)
   - Create calling service
   - Develop calling UI components
   - Implement call history features

3. **Integration**:
   - Connect signaling server with Socket.IO
   - Test peer-to-peer connections
   - Implement call logging and history

4. **Testing**:
   - Test audio/video quality
   - Verify call setup and teardown
   - Test call history and notifications

## Security Considerations

1. **Encryption**: All WebRTC connections use DTLS-SRTP encryption
2. **Authentication**: Calls require valid JWT tokens
3. **Authorization**: Only partners can call each other
4. **Privacy**: Media streams are peer-to-peer, not stored on servers

## Performance Considerations

1. **Bandwidth**: Implement adaptive bitrate based on network conditions
2. **Fallback**: Provide audio-only option when video quality is poor
3. **Connection**: Use STUN/TURN servers for NAT traversal
4. **Battery**: Optimize media processing to reduce battery drain

## Future Enhancements

1. **Call Recording**: Secure call recording functionality
2. **Screen Sharing**: Share screen during video calls
3. **Group Calls**: Multi-party calling capabilities
4. **Call Transcription**: Real-time call transcription
5. **Call Scheduling**: Schedule future calls with reminders