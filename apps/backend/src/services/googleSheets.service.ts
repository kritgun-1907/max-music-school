// apps/backend/src/services/googleSheets.service.ts
import { google, sheets_v4 } from 'googleapis';
import { JWT } from 'google-auth-library';
import Redis from 'redis';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// ==================== VALIDATION SCHEMAS ====================

// Based on your actual Google Sheets structure
const StudentSchema = z.object({
  x: z.string(), // ID/Timestamp
  name: z.string(),
  contact: z.string(),
  email: z.string().email(),
  batchName: z.string(),
  password: z.string(),
  classDays: z.string(),
  timeFrom: z.string(),
  timeTill: z.string(),
  subject: z.string(),
  course: z.string(),
  mode: z.enum(['Offline', 'Online']),
  startDate: z.string(),
  endDate: z.string(),
  days: z.number(),
  classes: z.number(),
  status: z.enum(['Active', 'Inactive', 'Hold']),
  teacher: z.string(),
  paidAmount: z.number(),
  upcomingAmount: z.number(),
  upcomingDays: z.number(),
  upcomingClasses: z.number(),
  rep: z.string().optional(),
  attendancePercentage: z.number()
});

const TeacherSchema = z.object({
  name: z.string(),
  contact: z.string(),
  email: z.string().email(),
  password: z.string(),
  subject: z.string(),
  status: z.enum(['Active', 'Hold'])
});

const LogEntrySchema = z.object({
  timestamp: z.string(),
  userType: z.enum(['Student', 'Teacher']),
  userId: z.string(),
  action: z.string(),
  details: z.string().optional()
});

export class GoogleSheetsService {
  private sheets!: sheets_v4.Sheets; // Use definite assignment assertion
  private auth!: JWT;
  private redisClient!: Redis.RedisClientType;
  private spreadsheetId: string;
  private isInitialized: boolean = false;
  
  // Sheet ranges based on your structure
  private readonly SHEETS = {
    STUDENTS: 'Students',
    TEACHERS: 'Teachers',
    LOGS: 'Logs'
  };

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID!;
    this.initialize(); // Call async init without await (fire and forget)
  }

  private async initialize() {
    await Promise.all([
      this.initializeAuth(),
      this.initializeRedis()
    ]);
    this.isInitialized = true;
  }

  private async initializeAuth() {
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  private async initializeRedis() {
    this.redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await this.redisClient.connect();
    
    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  private async ensureInitialized() {
    // Wait for initialization if not done
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // ==================== STUDENT OPERATIONS ====================

  async getStudentByEmail(email: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      
      // Check cache first
      const cacheKey = `student:email:${email}`;
      const cached = await this.redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from Google Sheets
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.STUDENTS}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return null;

      const headers = rows[0];
      const studentRow = rows.find((row, index) => {
        if (index === 0) return false; // Skip header
        return row[3] === email; // Email is in column D (index 3)
      });

      if (!studentRow) return null;

      const student = this.mapRowToStudent(studentRow);
      
      // Cache for 5 minutes
      await this.redisClient.setEx(cacheKey, 300, JSON.stringify(student));
      
      return student;
    } catch (error) {
      console.error('Error fetching student by email:', error);
      throw error;
    }
  }

  async getStudentById(studentId: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      
      const cacheKey = `student:${studentId}`;
      const cached = await this.redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.STUDENTS}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return null;

      const studentRow = rows.find((row, index) => {
        if (index === 0) return false;
        return row[0] === studentId; // ID is in column A
      });

      if (!studentRow) return null;

      const student = this.mapRowToStudent(studentRow);
      
      await this.redisClient.setEx(cacheKey, 300, JSON.stringify(student));
      
      return student;
    } catch (error) {
      console.error('Error fetching student by ID:', error);
      throw error;
    }
  }

  private mapRowToStudent(row: any[]): any {
    return {
      id: row[0] || '',
      name: row[1] || '',
      contact: row[2] || '',
      email: row[3] || '',
      batchName: row[4] || '',
      passwordHash: row[5] || '', // Note: This should be hashed
      classDays: row[6] || '',
      timeFrom: row[7] || '',
      timeTill: row[8] || '',
      subject: row[9] || '',
      course: row[10] || '',
      mode: row[11] || 'Offline',
      startDate: row[12] || '',
      endDate: row[13] || '',
      days: parseInt(row[14]) || 0,
      classes: parseInt(row[15]) || 0,
      status: row[16] || 'Active',
      teacher: row[17] || '',
      paidAmount: parseFloat(row[18]) || 0,
      upcomingAmount: parseFloat(row[19]) || 0,
      upcomingDays: parseInt(row[20]) || 0,
      upcomingClasses: parseInt(row[21]) || 0,
      rep: row[22] || '',
      attendancePercentage: parseFloat(row[23]) || 0
    };
  }

  async updateStudentData(studentId: string, updates: Partial<any>): Promise<any> {
    try {
      await this.ensureInitialized();
      
      // Find the row index
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.STUDENTS}!A:A`
      });
      
      const studentIds = response.data.values?.flat() || [];
      const rowIndex = studentIds.indexOf(studentId);
      
      if (rowIndex === -1) {
        throw new Error('Student not found');
      }

      // Get current data
      const currentData = await this.getStudentById(studentId);
      const updatedData = { ...currentData, ...updates };

      // Prepare the row data
      const rowData = [
        updatedData.id,
        updatedData.name,
        updatedData.contact,
        updatedData.email,
        updatedData.batchName,
        updatedData.passwordHash,
        updatedData.classDays,
        updatedData.timeFrom,
        updatedData.timeTill,
        updatedData.subject,
        updatedData.course,
        updatedData.mode,
        updatedData.startDate,
        updatedData.endDate,
        updatedData.days,
        updatedData.classes,
        updatedData.status,
        updatedData.teacher,
        updatedData.paidAmount,
        updatedData.upcomingAmount,
        updatedData.upcomingDays,
        updatedData.upcomingClasses,
        updatedData.rep || '',
        updatedData.attendancePercentage
      ];

      // Update the row (rowIndex + 1 because sheets are 1-indexed)
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.STUDENTS}!A${rowIndex + 1}:X${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });

      // Clear cache
      await this.redisClient.del(`student:${studentId}`);
      await this.redisClient.del(`student:email:${updatedData.email}`);
      
      return updatedData;
    } catch (error) {
      console.error('Error updating student data:', error);
      throw error;
    }
  }

  // ==================== NEW METHODS FOR TEACHER ROUTES ====================

  /**
   * Add a new student row to the Students sheet
   */
  public async addStudentRow(rowData: any[]): Promise<void> {
    try {
      await this.ensureInitialized();
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Students!A:X',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData]
        }
      });
      
      // Clear cache for students list
      await this.redisClient.del('students:all');
    } catch (error) {
      console.error('Error adding student row:', error);
      throw error;
    }
  }

  /**
   * Get attendance logs filtered by batch name
   */
  public async getAttendanceLogs(
    batchName: string, 
    month?: string, 
    year?: string
  ): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Logs!A:E'
      });
      
      const rows = response.data.values || [];
      const attendanceLogs = rows
        .filter((row, index) => {
          if (index === 0) return false; // Skip header
          
          let matches = row[1] === 'Attendance' && row[3]?.includes(batchName);
          
          // Additional filtering by month/year if provided
          if (matches && month && year) {
            const timestamp = new Date(row[0]);
            matches = timestamp.getMonth() + 1 === parseInt(month) &&
                     timestamp.getFullYear() === parseInt(year);
          }
          
          return matches;
        })
        .map(log => ({
          timestamp: log[0],
          action: log[1],
          studentId: log[2],
          status: log[3],
          date: log[4]
        }));
      
      return attendanceLogs;
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
      throw error;
    }
  }

  /**
   * Get all pending change requests from the Logs sheet
   */
  public async getChangeRequests(): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Logs!A:E'
      });
      
      const rows = response.data.values || [];
      const requests = rows
        .filter((row, index) => {
          if (index === 0) return false; // Skip header
          return row[1] === 'Change Request';
        })
        .map(row => ({
          timestamp: row[0],
          action: row[1],
          studentId: row[2],
          requestType: row[3],
          reason: row[4]
        }));
      
      return requests;
    } catch (error) {
      console.error('Error fetching change requests:', error);
      throw error;
    }
  }

  /**
   * Log an activity to the Logs sheet
   */
  public async logActivity(
    action: string, 
    userId: string, 
    details: string, 
    extra: string
  ): Promise<void> {
    try {
      await this.ensureInitialized();
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Logs!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            new Date().toISOString(),
            action,
            userId,
            details,
            extra
          ]]
        }
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  // ==================== TEACHER OPERATIONS ====================

  async getTeacherByEmail(email: string): Promise<any | null> {
    try {
      await this.ensureInitialized();
      
      const cacheKey = `teacher:email:${email}`;
      const cached = await this.redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.TEACHERS}!A:F`
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return null;

      const teacherRow = rows.find((row, index) => {
        if (index === 0) return false; // Skip header
        return row[2] === email; // Email is in column C
      });

      if (!teacherRow) return null;

      const teacher = this.mapRowToTeacher(teacherRow);
      
      await this.redisClient.setEx(cacheKey, 300, JSON.stringify(teacher));
      
      return teacher;
    } catch (error) {
      console.error('Error fetching teacher by email:', error);
      throw error;
    }
  }

  private mapRowToTeacher(row: any[]): any {
    return {
      name: row[0] || '',
      contact: row[1] || '',
      email: row[2] || '',
      passwordHash: row[3] || '', // This should be hashed
      subject: row[4] || '',
      status: row[5] || 'Active'
    };
  }

  // ==================== AUTHENTICATION OPERATIONS ====================

  async getUserByEmail(email: string, role: 'student' | 'teacher'): Promise<any | null> {
    if (role === 'student') {
      return this.getStudentByEmail(email);
    } else {
      return this.getTeacherByEmail(email);
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    // If the password is not hashed in the sheet (for demo), compare directly
    // In production, always use hashed passwords
    if (hashedPassword.startsWith('$2')) {
      return bcrypt.compare(plainPassword, hashedPassword);
    }
    return plainPassword === hashedPassword;
  }

  // ==================== BATCH OPERATIONS ====================

  async getStudentBatches(studentId: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const student = await this.getStudentById(studentId);
      if (!student) return [];

      // Parse batch information from student data
      const batch = {
        name: student.batchName,
        teacher: student.teacher,
        subject: student.subject,
        course: student.course,
        classDays: student.classDays,
        timeFrom: student.timeFrom,
        timeTill: student.timeTill,
        mode: student.mode,
        startDate: student.startDate,
        endDate: student.endDate,
        totalClasses: student.classes,
        upcomingClasses: student.upcomingClasses
      };

      return [batch]; // Currently one batch per student based on your structure
    } catch (error) {
      console.error('Error fetching student batches:', error);
      return [];
    }
  }

  async getTeacherBatches(teacherName: string): Promise<any[]> {
    try {
      await this.ensureInitialized();
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.STUDENTS}!A:Z`
      });

      const rows = response.data.values || [];
      if (rows.length === 0) return [];

      // Filter students by teacher name
      const teacherStudents = rows.filter((row, index) => {
        if (index === 0) return false;
        return row[17] === teacherName; // Teacher column
      });

      // Group by batch
      const batchesMap = new Map();
      
      teacherStudents.forEach(row => {
        const batchKey = `${row[4]}-${row[7]}-${row[8]}`; // BatchName-TimeFrom-TimeTill
        
        if (!batchesMap.has(batchKey)) {
          batchesMap.set(batchKey, {
            batchName: row[4],
            subject: row[9],
            course: row[10],
            classDays: row[6],
            timeFrom: row[7],
            timeTill: row[8],
            mode: row[11],
            students: []
          });
        }
        
        batchesMap.get(batchKey).students.push({
          id: row[0],
          name: row[1],
          contact: row[2],
          email: row[3],
          status: row[16],
          attendancePercentage: parseFloat(row[23]) || 0
        });
      });

      return Array.from(batchesMap.values());
    } catch (error) {
      console.error('Error fetching teacher batches:', error);
      return [];
    }
  }

  // ==================== ATTENDANCE OPERATIONS ====================

  async markAttendance(
    batchName: string, 
    date: string, 
    attendanceData: Array<{studentId: string; name: string; status: 'present' | 'absent'}>
  ): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Log attendance in the Logs sheet
      const logEntries = attendanceData.map(({ studentId, name, status }) => [
        new Date().toISOString(),
        'Attendance',
        studentId,
        `${name} - ${status.toUpperCase()} in ${batchName}`,
        date
      ]);

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.LOGS}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: logEntries
        }
      });

      // Update attendance percentage for each student
      for (const { studentId, status } of attendanceData) {
        if (status === 'present') {
          const student = await this.getStudentById(studentId);
          if (student) {
            // Simple calculation - you may want to make this more sophisticated
            const currentPercentage = student.attendancePercentage || 0;
            const totalClasses = student.classes || 1;
            const attendedClasses = Math.round((currentPercentage / 100) * totalClasses) + 1;
            const newPercentage = (attendedClasses / (totalClasses + 1)) * 100;
            
            await this.updateStudentData(studentId, {
              attendancePercentage: newPercentage
            });
          }
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  }

  async getStudentAttendance(studentId: string, month?: number, year?: number): Promise<any> {
    try {
      await this.ensureInitialized();
      
      const student = await this.getStudentById(studentId);
      if (!student) return null;

      // Get logs for this student
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.LOGS}!A:E`
      });

      const rows = response.data.values || [];
      const studentLogs = rows.filter((row, index) => {
        if (index === 0) return false;
        return row[2] === studentId && row[1] === 'Attendance';
      });

      return {
        overallPercentage: student.attendancePercentage,
        totalClasses: student.classes,
        upcomingClasses: student.upcomingClasses,
        logs: studentLogs.map(log => ({
          date: log[0],
          status: log[3],
          batchDate: log[4]
        }))
      };
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  }

  // ==================== REQUEST MANAGEMENT ====================

  async createChangeRequest(request: {
    studentId: string,
    type: string,
    oldValue: string,
    newValue: string,
    reason?: string
  }): Promise<any> {
    try {
      await this.ensureInitialized();
      
      const requestId = `REQ${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      // Add to Logs sheet as a request
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.SHEETS.LOGS}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            timestamp,
            'Change Request',
            request.studentId,
            `${request.type}: ${request.oldValue} -> ${request.newValue}`,
            request.reason || 'No reason provided'
          ]]
        }
      });
      
      return {
        id: requestId,
        ...request,
        status: 'pending',
        requestDate: timestamp
      };
    } catch (error) {
      console.error('Error creating change request:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD DATA ====================

  async getStudentDashboardData(studentId: string): Promise<any> {
    try {
      await this.ensureInitialized();
      
      const student = await this.getStudentById(studentId);
      if (!student) return null;

      const batches = await this.getStudentBatches(studentId);
      const attendance = await this.getStudentAttendance(studentId);

      // Calculate next class date based on class days
      const nextClassDate = this.calculateNextClassDate(student.classDays);

      return {
        profile: {
          id: student.id,
          name: student.name,
          email: student.email,
          contact: student.contact,
          status: student.status
        },
        attendance: {
          percentage: student.attendancePercentage,
          totalClasses: student.classes,
          upcomingClasses: student.upcomingClasses,
          daysRemaining: student.upcomingDays
        },
        batch: batches[0] || null,
        payment: {
          paidAmount: student.paidAmount,
          upcomingAmount: student.upcomingAmount,
          status: student.upcomingAmount > 0 ? 'pending' : 'paid'
        },
        schedule: {
          nextClass: nextClassDate,
          classDays: student.classDays,
          timing: `${student.timeFrom} - ${student.timeTill}`
        }
      };
    } catch (error) {
      console.error('Error fetching student dashboard:', error);
      throw error;
    }
  }

  async getTeacherDashboardData(teacherEmail: string): Promise<any> {
    try {
      await this.ensureInitialized();
      
      const teacher = await this.getTeacherByEmail(teacherEmail);
      if (!teacher) return null;

      const batches = await this.getTeacherBatches(teacher.name);
      
      // Calculate total students - Fixed type annotation
      const totalStudents = batches.reduce((sum: number, batch: any) => 
        sum + batch.students.length, 0
      );
      
      return {
        profile: {
          name: teacher.name,
          email: teacher.email,
          contact: teacher.contact,
          subject: teacher.subject,
          status: teacher.status
        },
        statistics: {
          totalBatches: batches.length,
          totalStudents: totalStudents,
          activeStudents: batches.reduce((sum: number, batch: any) => 
            sum + batch.students.filter((s: any) => s.status === 'Active').length, 0
          )
        },
        batches: batches,
        todaySchedule: this.getTodaySchedule(batches)
      };
    } catch (error) {
      console.error('Error fetching teacher dashboard:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private calculateNextClassDate(classDays: string): string {
    const days = classDays.split('-');
    const today = new Date();
    const dayMap: {[key: string]: number} = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
    };
    
    const classDayNumbers = days.map(day => dayMap[day]);
    const currentDay = today.getDay();
    
    // Find next class day
    let nextDay = classDayNumbers.find(day => day > currentDay);
    if (!nextDay) {
      nextDay = classDayNumbers[0]; // Next week
    }
    
    const daysUntilNext = (nextDay - currentDay + 7) % 7 || 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);
    
    return nextDate.toDateString();
  }

  private getTodaySchedule(batches: any[]): any[] {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayName = dayNames[today.getDay()];
    
    return batches.filter(batch => 
      batch.classDays.includes(todayName)
    ).map(batch => ({
      batchName: batch.batchName,
      timing: `${batch.timeFrom} - ${batch.timeTill}`,
      studentCount: batch.students.length,
      mode: batch.mode
    }));
  }

  // ==================== TOKEN MANAGEMENT ====================

  private refreshTokens = new Map<string, string>();

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    await this.ensureInitialized();
    this.refreshTokens.set(userId, token);
    await this.redisClient.setEx(`refresh_token:${userId}`, 604800, token); // 7 days
  }

  async verifyRefreshToken(userId: string, token: string): Promise<boolean> {
    await this.ensureInitialized();
    const storedToken = await this.redisClient.get(`refresh_token:${userId}`);
    return storedToken === token;
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.ensureInitialized();
    this.refreshTokens.delete(userId);
    await this.redisClient.del(`refresh_token:${userId}`);
  }

  // ==================== CLEANUP ====================

  async disconnect(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}