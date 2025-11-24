import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    // Join concern room
    socket.on('join-concern', (concernId) => {
      socket.join(`concern-${concernId}`);
      console.log(`User joined concern room: concern-${concernId}`);
    });

    // Leave concern room
    socket.on('leave-concern', (concernId) => {
      socket.leave(`concern-${concernId}`);
      console.log(`User left concern room: concern-${concernId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ concernId, userName }) => {
      socket.to(`concern-${concernId}`).emit('user-typing', { userName });
    });

    socket.on('stop-typing', ({ concernId }) => {
      socket.to(`concern-${concernId}`).emit('user-stop-typing');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit new message to concern room
export const emitNewMessage = (concernId, message) => {
  if (io) {
    io.to(`concern-${concernId}`).emit('new-message', message);
  }
};

// Emit concern status update
export const emitStatusUpdate = (concernId, update) => {
  if (io) {
    io.to(`concern-${concernId}`).emit('status-update', update);
  }
};

// Emit notification to specific user
export const emitNotification = (userId, notification) => {
  if (io) {
    io.to(`user-${userId}`).emit('notification', notification);
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
