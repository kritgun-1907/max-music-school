// apps/backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { redisService } from './services/redis.service';

// Load environment variables
dotenv.config();

// Import routes
import studentRoutes from './routes/student_routes';
import teacherRoutes from './routes/teacher_routes';
import authRoutes from './routes/auth.routes';
import { apiRateLimiter, securityHeaders } from './middleware/auth_middleware';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(securityHeaders);
app.use(apiRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/auth', authRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', (data) => {
    const { userId, userType } = data;
    socket.join(`${userType}:${userId}`);
    console.log(`User ${userId} joined as ${userType}`);
  });
  
  socket.on('attendance:marked', (data) => {
    const { batchName, students } = data;
    students.forEach((student: any) => {
      io.to(`student:${student.studentId}`).emit('attendance:updated', {
        status: student.status,
        date: new Date().toISOString()
      });
    });
  });
  
  socket.on('request:created', (data) => {
    const { teacherName, request } = data;
    io.to(`teacher:${teacherName}`).emit('request:new', request);
  });
  
  socket.on('request:approved', (data) => {
    const { studentId, changes } = data;
    io.to(`student:${studentId}`).emit('request:status', {
      status: 'approved',
      changes
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

// Start server with Redis initialization
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize Redis first
    await redisService.connect();
    console.log('✅ Redis service initialized');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`
    🎵 Max Music School Server Started! 🎵
    =====================================
    Server running on port ${PORT}
    Environment: ${process.env.NODE_ENV}
    API URL: http://localhost:${PORT}
    Socket.io: Enabled
    =====================================
  `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await redisService.disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await redisService.disconnect();
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

startServer();

export default app;