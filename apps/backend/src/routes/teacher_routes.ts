// apps/backend/src/routes/teacher.routes.ts
import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from './../middleware/auth_middleware';
import { GoogleSheetsService } from '../services/googleSheets.service';
import { z } from 'zod';

const router = Router();
const sheetsService = new GoogleSheetsService();

// Validation Schemas
const TeacherLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const AttendanceSchema = z.object({
  batchName: z.string(),
  date: z.string(),
  students: z.array(z.object({
    studentId: z.string(),
    name: z.string(),
    status: z.enum(['present', 'absent'])
  }))
});

const AddStudentSchema = z.object({
  name: z.string(),
  contact: z.string(),
  email: z.string().email(),
  batchName: z.string(),
  password: z.string().min(4),
  classDays: z.string(),
  timeFrom: z.string(),
  timeTill: z.string(),
  subject: z.string(),
  course: z.string(),
  mode: z.enum(['Offline', 'Online']),
  startDate: z.string(),
  endDate: z.string(),
  paidAmount: z.number()
});

// Validation middleware wrapper
const validateRequest = (schema: z.ZodSchema) => {
  return (req: AuthRequest, res: Response, next: Function) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.issues 
        });
      }
      next(error);
    }
  };
};

// ==================== TEACHER AUTHENTICATION ====================

router.post('/login', validateRequest(TeacherLoginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const teacher = await sheetsService.getTeacherByEmail(email);
    
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await sheetsService.verifyPassword(password, teacher.passwordHash);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (teacher.status !== 'Active') {
      return res.status(403).json({ 
        error: 'Account is not active',
        status: teacher.status
      });
    }
    
    // Generate tokens
    const { authService } = require('../middleware/auth.middleware');
    const accessToken = authService.generateAccessToken({
      userId: teacher.email, // Using email as ID for teachers
      email: teacher.email,
      role: 'teacher'
    });
    
    const refreshToken = authService.generateRefreshToken(teacher.email);
    await sheetsService.storeRefreshToken(teacher.email, refreshToken);
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        name: teacher.name,
        email: teacher.email,
        contact: teacher.contact,
        subject: teacher.subject,
        status: teacher.status
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== TEACHER DASHBOARD ====================

router.get('/dashboard', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const dashboardData = await sheetsService.getTeacherDashboardData(req.user!.email);
    
    if (!dashboardData) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ==================== BATCH MANAGEMENT ====================

router.get('/batches', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const batches = await sheetsService.getTeacherBatches(teacher.name);
    
    res.json(batches);
  } catch (error) {
    console.error('Batches error:', error);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

router.get('/batches/:batchName/students', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { batchName } = req.params;
    const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const batches = await sheetsService.getTeacherBatches(teacher.name);
    const batch = batches.find((b: any) => b.batchName === batchName);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }
    
    res.json(batch.students);
  } catch (error) {
    console.error('Batch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ==================== STUDENT MANAGEMENT ====================

router.post('/add-student', 
  authenticate, 
  authorize('teacher'), 
  validateRequest(AddStudentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const studentData = req.body;
      const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
      
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      
      // Generate student ID (timestamp-based)
      const studentId = `${Date.now()}`;
      
      // Calculate class details
      const startDate = new Date(studentData.startDate);
      const endDate = new Date(studentData.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Estimate number of classes based on class days
      const classDaysCount = studentData.classDays.split('-').length;
      const weeksCount = Math.ceil(daysDiff / 7);
      const totalClasses = weeksCount * classDaysCount;
      
      // Prepare row data for Google Sheets
      const rowData = [
        studentId,
        studentData.name,
        studentData.contact,
        studentData.email,
        studentData.batchName,
        studentData.password, // Should be hashed in production
        studentData.classDays,
        studentData.timeFrom,
        studentData.timeTill,
        studentData.subject,
        studentData.course,
        studentData.mode,
        studentData.startDate,
        studentData.endDate,
        daysDiff,
        totalClasses,
        'Active', // Status
        teacher.name, // Teacher name
        studentData.paidAmount,
        0, // Upcoming amount
        daysDiff, // Upcoming days
        totalClasses, // Upcoming classes
        '', // Rep
        100 // Initial attendance %
      ];
      
      // Add to Google Sheets using the service method
      await sheetsService.addStudentRow(rowData);
      
      res.json({
        success: true,
        message: 'Student added successfully',
        studentId: studentId
      });
    } catch (error) {
      console.error('Add student error:', error);
      res.status(500).json({ error: 'Failed to add student' });
    }
});

router.put('/students/:studentId', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const updates = req.body;
    
    // Only allow updating certain fields
    const allowedFields = [
      'batchName', 'classDays', 'timeFrom', 'timeTill', 
      'status', 'upcomingAmount', 'endDate'
    ];
    
    const filteredUpdates: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }
    
    const updatedStudent = await sheetsService.updateStudentData(studentId, filteredUpdates);
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Failed to update student' });
  }
});

// ==================== ATTENDANCE ====================

router.post('/attendance', 
  authenticate, 
  authorize('teacher'), 
  validateRequest(AttendanceSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { batchName, date, students } = req.body;
      const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
      
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found' });
      }
      
      // Mark attendance
      await sheetsService.markAttendance(batchName, date, students);
      
      res.json({
        success: true,
        message: 'Attendance marked successfully',
        summary: {
          present: students.filter((s: any) => s.status === 'present').length,
          absent: students.filter((s: any) => s.status === 'absent').length,
          total: students.length
        }
      });
    } catch (error) {
      console.error('Attendance error:', error);
      res.status(500).json({ error: 'Failed to mark attendance' });
    }
});

router.get('/attendance/history', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { batchName, month, year } = req.query;
    const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Get attendance logs using the service method
    const attendanceLogs = await sheetsService.getAttendanceLogs(
      batchName as string,
      month as string,
      year as string
    );
    
    res.json({
      batchName,
      logs: attendanceLogs
    });
  } catch (error) {
    console.error('Attendance history error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history' });
  }
});

// ==================== CHANGE REQUESTS ====================

router.get('/requests', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    // Get requests using service method
    const requests = await sheetsService.getChangeRequests();
    
    // Get student details for each request
    const requestsWithDetails = await Promise.all(requests.map(async (request: any) => {
      const student = await sheetsService.getStudentById(request.studentId);
      return {
        timestamp: request.timestamp,
        studentId: request.studentId,
        studentName: student?.name || 'Unknown',
        requestType: request.requestType,
        reason: request.reason,
        currentBatch: student?.batchName,
        status: 'pending'
      };
    }));
    
    res.json(requestsWithDetails);
  } catch (error) {
    console.error('Requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.post('/requests/:requestId/approve', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { updates } = req.body; // New batch details
    
    // Update student data
    if (updates && updates.studentId) {
      await sheetsService.updateStudentData(updates.studentId, {
        batchName: updates.batchName,
        timeFrom: updates.timeFrom,
        timeTill: updates.timeTill,
        classDays: updates.classDays
      });
      
      // Log approval using service method
      await sheetsService.logActivity(
        'Request Approved',
        updates.studentId,
        `Batch change approved by ${req.user!.email}`,
        ''
      );
    }
    
    res.json({
      success: true,
      message: 'Request approved successfully'
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// ==================== STATISTICS ====================

router.get('/statistics', authenticate, authorize('teacher'), async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await sheetsService.getTeacherByEmail(req.user!.email);
    
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    
    const batches = await sheetsService.getTeacherBatches(teacher.name);
    
    // Calculate statistics
    const stats = {
      totalBatches: batches.length,
      totalStudents: batches.reduce((sum: number, b: any) => sum + b.students.length, 0),
      activeStudents: batches.reduce((sum: number, b: any) => 
        sum + b.students.filter((s: any) => s.status === 'Active').length, 0
      ),
      onHoldStudents: batches.reduce((sum: number, b: any) => 
        sum + b.students.filter((s: any) => s.status === 'Hold').length, 0
      ),
      averageAttendance: batches.reduce((sum: number, b: any) => {
        const batchAvg = b.students.reduce((s: number, st: any) => 
          s + (st.attendancePercentage || 0), 0) / b.students.length;
        return sum + batchAvg;
      }, 0) / batches.length,
      batchDetails: batches.map((b: any) => ({
        name: b.batchName,
        studentCount: b.students.length,
        timing: `${b.timeFrom} - ${b.timeTill}`,
        days: b.classDays,
        mode: b.mode
      }))
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;