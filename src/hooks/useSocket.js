

export const useSocket = () => {
  // eslint-disable-next-line no-undef
  const context = context(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};