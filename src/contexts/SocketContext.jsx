import { createContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export { SocketContext };

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [deviceConnections, setDeviceConnections] = useState([]);
  const userId = 'demo-user';
  const socketRef = useRef(socket);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const prodDefault = typeof window !== 'undefined' ? window.location.origin : '';
    const socketUrl = import.meta.env.PROD
      ? (import.meta.env.VITE_SOCKET_URL || prodDefault)
      : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001');

    console.log('Connecting to Socket.IO server at:', socketUrl);

    const newSocket = io(socketUrl, {
      path: '/socket.io',
      // Prefer polling first; Socket.IO will upgrade to WebSocket if mümkün
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        return;
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnected(false);
    });

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
      console.log('Content updated:', data);
    });

    newSocket.on('userTyping', (data) => {
      console.log('User typing:', data);
    });

    newSocket.on('userStopTyping', (data) => {
      console.log('User stopped typing:', data);
    });

    newSocket.on('presenceUpdated', (data) => {
      console.log('Presence updated:', data);
    });

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

  const chatJoin = (roomId, name) => {
    socketRef.current?.emit('chat:join', { roomId, name });
  };
  const chatSend = (roomId, text, name) => {
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    socketRef.current?.emit('chat:message', { roomId, text, name, tempId });
    return tempId;
  };
  const chatTyping = (roomId) => socketRef.current?.emit('chat:typing', { roomId });
  const chatStopTyping = (roomId) => socketRef.current?.emit('chat:stopTyping', { roomId });
  const chatDelete = (roomId, messageId) => socketRef.current?.emit('chat:delete', { roomId, messageId });

  const value = {
    socket,
    connected,
    roomState,
    deviceConnections,
    joinRoom,
    updateContent,
    startTyping,
    stopTyping,
    updatePresence,
    chatJoin,
    chatSend,
    chatTyping,
    chatStopTyping,
    chatDelete
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};