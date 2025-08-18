import { createContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.js';

const SocketContext = createContext();

export { SocketContext };

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [deviceConnections, setDeviceConnections] = useState([]);
  const { user } = useAuth();
  const userId = user?.id;
  const socketRef = useRef(socket);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // Cleanup existing socket with proper disconnect
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Create new socket connection
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      auth: {
        token: token
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true // Force new connection
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setConnected(false);
      
      // Only attempt reconnection for network issues, not manual disconnects
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return;
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
    });

    // Handle multiple device notifications
    newSocket.on('newDeviceConnected', (data) => {
      console.log('New device connected:', data);
      setDeviceConnections(prev => [...prev, data]);
    });

    newSocket.on('deviceDisconnected', (data) => {
      console.log('Device disconnected:', data);
      setDeviceConnections(prev => prev.filter(conn => conn.deviceId !== data.deviceId));
    });

    newSocket.on('roomState', (state) => {
      setRoomState(state);
    });

    newSocket.on('contentUpdated', (data) => {
      // Handle content updates
      console.log('Content updated:', data);
      // This will trigger re-renders in components that listen for updates
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

    // Update state and ref
    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [userId]);

  const joinRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('joinRoom', roomId);
    }
  };

  const updateContent = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('contentUpdate', data);
    }
  };

  const startTyping = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('typingStart', data);
    }
  };

  const stopTyping = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('typingStop', data);
    }
  };

  const updatePresence = (data) => {
    if (socketRef.current) {
      socketRef.current.emit('updatePresence', data);
    }
  };

  const value = {
    socket,
    connected,
    roomState,
    deviceConnections,
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