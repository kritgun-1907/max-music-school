// apps/backend/src/services/socket.service.ts
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

class SocketService {
  private io: SocketIOServer | null = null;

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: true
      },
      pingTimeout: Number(process.env.SOCKET_IO_PING_TIMEOUT) || 60000
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`✅ Socket connected: ${socket.id}`);

      socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);
      });

      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });

    console.log('✅ Socket.IO initialized');
  }

  // Emit attendance update to all clients
  emitAttendanceUpdate(batchId: string, data: any): void {
    if (this.io) {
      this.io.emit('attendance:update', { batchId, data });
    }
  }

  // Emit batch change notification
  emitBatchChangeNotification(studentId: string, data: any): void {
    if (this.io) {
      this.io.to(`student:${studentId}`).emit('batch:change', data);
    }
  }

  // Emit request status update
  emitRequestStatusUpdate(requestId: string, status: string, data: any): void {
    if (this.io) {
      this.io.emit('request:status', { requestId, status, data });
    }
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketService = new SocketService();
