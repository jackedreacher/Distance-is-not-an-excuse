import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const userId = user?.id;
  const socketRef = useRef(socket);

  useEffect(() => {
    // Only create socket if we have a user ID and token
    if (!userId) {
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    // If we already have a socket, check if it's for the same user
    if (socketRef.current) {
      // Close existing socket if it exists
      socketRef.current.close();
    }

    // Create new socket connection
    const newSocket = io('http://localhost:5001', {
      auth: {
        token: token
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

    // Cleanup function
    return () => {
      if (newSocket) {
        newSocket.close();
        socketRef.current = null;
      }
    };
  }, [userId]); // Only recreate socket when userId changes

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