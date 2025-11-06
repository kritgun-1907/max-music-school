// apps/backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import Redis from 'redis';

// Load environment variables
dotenv.config();

// Import routes
import studentRoutes from './routes/student_routes';
import teacherRoutes from './routes/teacher_routes';
import { apiRateLimiter, securityHeaders } from './middleware/auth_middleware';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time updates
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

// Common endpoints for both student and teacher
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const { authService } = require('./middleware/auth.middleware');
    const sheetsService = require('./services/googleSheets.service');
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    const payload = authService.verifyRefreshToken(refreshToken);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    const isValid = await sheetsService.verifyRefreshToken(payload.userId, refreshToken);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const newAccessToken = authService.generateAccessToken({
      userId: payload.userId,
      email: '', // Fetch from database if needed
      role: 'student' // Determine from userId pattern
    });
    
    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join room based on user type
  socket.on('join', (data) => {
    const { userId, userType } = data;
    socket.join(`${userType}:${userId}`);
    console.log(`User ${userId} joined as ${userType}`);
  });
  
  // Handle attendance updates
  socket.on('attendance:marked', (data) => {
    const { batchName, students } = data;
    // Notify affected students
    students.forEach((student: any) => {
      io.to(`student:${student.studentId}`).emit('attendance:updated', {
        status: student.status,
        date: new Date().toISOString()
      });
    });
  });
  
  // Handle batch change requests
  socket.on('request:created', (data) => {
    const { teacherName, request } = data;
    // Notify teacher
    io.to(`teacher:${teacherName}`).emit('request:new', request);
  });
  
  // Handle request approval
  socket.on('request:approved', (data) => {
    const { studentId, changes } = data;
    // Notify student
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

// Start server
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`
    ðŸŽµ Max Music School Server Started! ðŸŽµ
    =====================================
    Server running on port ${PORT}
    Environment: ${process.env.NODE_ENV}
    API URL: http://localhost:${PORT}
    Socket.io: Enabled
    =====================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;