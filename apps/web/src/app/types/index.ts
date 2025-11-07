// apps/web/src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  contact?: string;
  status?: string;
}

export interface Student extends User {
  batchName: string;
  teacher: string;
  subject: string;
  course: string;
  classDays: string;
  timeFrom: string;
  timeTill: string;
  mode: 'Online' | 'Offline';
  startDate: string;
  endDate: string;
  days: number;
  classes: number;
  paidAmount: number;
  upcomingAmount: number;
  upcomingDays: number;
  upcomingClasses: number;
  attendancePercentage: number;
}

export interface Teacher extends User {
  subject: string;
}

export interface Batch {
  id: string;
  batchName: string;
  teacher: string;
  subject: string;
  course: string;
  classDays: string;
  timeFrom: string;
  timeTill: string;
  mode: 'Online' | 'Offline';
  students: StudentInBatch[];
}

export interface StudentInBatch {
  id: string;
  name: string;
  contact: string;
  email: string;
  status: string;
  attendancePercentage: number;
}

export interface AttendanceRecord {
  studentId: string;
  name: string;
  status: 'present' | 'absent';
}

export interface AttendanceSubmission {
  batchName: string;
  date: string;
  students: AttendanceRecord[];
}

export interface ChangeRequest {
  id?: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  requestType: string;
  currentBatch: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DashboardData {
  profile: {
    name: string;
    email: string;
    status: string;
  };
  attendance: {
    percentage: number;
    totalClasses: number;
    upcomingClasses: number;
    daysRemaining: number;
  };
  batch: {
    name: string;
    teacher: string;
    subject: string;
    classDays: string[];
    timing: { from: string; till: string };
    mode: string;
  };
  payment: {
    paidAmount: number;
    upcomingAmount: number;
    status: string;
  };
  schedule: {
    nextClass: string;
  };
}

export interface TeacherDashboardData {
  profile: {
    name: string;
    email: string;
    contact: string;
    subject: string;
    status: string;
  };
  statistics: {
    totalBatches: number;
    totalStudents: number;
    activeStudents: number;
  };
  batches: Batch[];
  todaySchedule: {
    batchName: string;
    timing: string;
    studentCount: number;
    mode: string;
  }[];
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}