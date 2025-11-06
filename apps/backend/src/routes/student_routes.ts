// apps/backend/src/routes/student.routes.ts
import { Router, Response } from 'express'; // Remove Request import
import { authenticate, authorize, validateRequest, AuthRequest } from './../middleware/auth_middleware'; // Add AuthRequest
import { GoogleSheetsService } from '../services/googleSheets.service';
import { z } from 'zod';

const router = Router();
const sheetsService = new GoogleSheetsService();

// Validation Schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const BatchChangeSchema = z.object({
  newBatchName: z.string(),
  newTiming: z.object({
    from: z.string(),
    till: z.string()
  }),
  newDays: z.string(),
  reason: z.string().optional()
});

const RatingSchema = z.object({
  date: z.string(),
  rating: z.number().min(1).max(5),
  feedback: z.string().optional()
});

// ==================== AUTHENTICATION ====================

router.post('/login', validateRequest(LoginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const student = await sheetsService.getStudentByEmail(email);
    
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await sheetsService.verifyPassword(password, student.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (student.status !== 'Active') {
      return res.status(403).json({ 
        error: `Account is ${student.status.toLowerCase()}`,
        status: student.status,
        message: student.status === 'Hold' 
          ? `Account on hold. Please pay ₹${student.upcomingAmount} to continue.`
          : 'Account is inactive. Please contact support.'
      });
    }
    
    const { authService } = require('../middleware/auth.middleware');
    const accessToken = authService.generateAccessToken({
      userId: student.id,
      email: student.email,
      role: 'student'
    });
    
    const refreshToken = authService.generateRefreshToken(student.id);
    await sheetsService.storeRefreshToken(student.id, refreshToken);
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        contact: student.contact,
        status: student.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== DASHBOARD ====================

router.get('/dashboard', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const dashboardData = await sheetsService.getStudentDashboardData(req.user!.userId);
    
    if (!dashboardData) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==================== PROFILE ====================

router.get('/profile', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await sheetsService.getStudentById(req.user!.userId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const { passwordHash, ...profile } = student;
    
    res.json(profile);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    
    const allowedFields = ['name', 'contact'];
    const filteredUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field]) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    const updatedStudent = await sheetsService.updateStudentData(
      req.user!.userId, 
      filteredUpdates
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==================== SCHEDULE ====================

router.get('/schedule', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await sheetsService.getStudentById(req.user!.userId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const schedule = {
      batchName: student.batchName,
      teacher: student.teacher,
      subject: student.subject,
      course: student.course,
      classDays: student.classDays.split('-'),
      timing: {
        from: student.timeFrom,
        till: student.timeTill
      },
      mode: student.mode,
      startDate: student.startDate,
      endDate: student.endDate,
      totalClasses: student.classes,
      upcomingClasses: student.upcomingClasses
    };
    
    res.json(schedule);
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// ==================== ATTENDANCE ====================

router.get('/attendance', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query;
    
    const attendance = await sheetsService.getStudentAttendance(
      req.user!.userId,
      month ? parseInt(month as string) : undefined,
      year ? parseInt(year as string) : undefined
    );
    
    res.json(attendance);
  } catch (error) {
    console.error('Attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// ==================== BATCH CHANGE REQUEST ====================

router.post('/request-change', 
  authenticate, 
  authorize('student'), 
  validateRequest(BatchChangeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { newBatchName, newTiming, newDays, reason } = req.body;
      const student = await sheetsService.getStudentById(req.user!.userId);
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      const request = await sheetsService.createChangeRequest({
        studentId: req.user!.userId,
        type: 'Batch Change',
        oldValue: `${student.batchName} (${student.timeFrom}-${student.timeTill})`,
        newValue: `${newBatchName} (${newTiming.from}-${newTiming.till})`,
        reason
      });
      
      res.json({
        success: true,
        message: 'Change request submitted successfully. Teacher will review it soon.',
        requestId: request.id
      });
    } catch (error) {
      console.error('Change request error:', error);
      res.status(500).json({ error: 'Failed to submit change request' });
    }
});

// ==================== PAYMENT INFO ====================

router.get('/payment-info', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await sheetsService.getStudentById(req.user!.userId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const paymentInfo = {
      paidAmount: student.paidAmount,
      upcomingAmount: student.upcomingAmount,
      status: student.upcomingAmount > 0 ? 'pending' : 'paid',
      upcomingDays: student.upcomingDays,
      upcomingClasses: student.upcomingClasses,
      accountStatus: student.status,
      message: student.status === 'Hold' 
        ? `Your account is on hold. Please pay ₹${student.upcomingAmount} to continue your classes.`
        : null
    };
    
    res.json(paymentInfo);
  } catch (error) {
    console.error('Payment info error:', error);
    res.status(500).json({ error: 'Failed to fetch payment information' });
  }
});

// ==================== RATE CLASS ====================

router.post('/rate-class', 
  authenticate, 
  authorize('student'), 
  validateRequest(RatingSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { date, rating, feedback } = req.body;
      
      // Use the public method instead
      await sheetsService.logActivity(
        'Class Rating',
        req.user!.userId,
        `Rating: ${rating}/5`,
        feedback || ''
      );
      
      res.json({
        success: true,
        message: 'Thank you for your feedback!',
        nextClassLink: 'https://zoom.us/j/...'
      });
    } catch (error) {
      console.error('Rating error:', error);
      res.status(500).json({ error: 'Failed to submit rating' });
    }
});

// ==================== UPCOMING CLASSES ====================

router.get('/upcoming-classes', authenticate, authorize('student'), async (req: AuthRequest, res: Response) => {
  try {
    const student = await sheetsService.getStudentById(req.user!.userId);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const upcomingClasses = [];
    const classDays = student.classDays.split('-');
    const today = new Date();
    
    for (let i = 0; i < student.upcomingClasses && upcomingClasses.length < 10; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][nextDate.getDay()];
      
      if (classDays.includes(dayName)) {
        upcomingClasses.push({
          date: nextDate.toISOString().split('T')[0],
          day: dayName,
          time: `${student.timeFrom} - ${student.timeTill}`,
          batchName: student.batchName,
          teacher: student.teacher,
          subject: student.subject,
          mode: student.mode
        });
      }
    }
    
    res.json(upcomingClasses);
  } catch (error) {
    console.error('Upcoming classes error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming classes' });
  }
});

export default router;