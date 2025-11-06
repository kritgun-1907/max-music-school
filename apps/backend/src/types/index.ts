// apps/backend/src/types/index.ts
export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  batchDay: string;
  batchTime: string;
  monthlyFees: string;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  dateOfJoining: string;
  attendance: number;
  totalClasses: number;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  batches: string[];
}

export interface BatchChangeRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  currentBatchDay: string;
  currentBatchTime: string;
  requestedBatchDay: string;
  requestedBatchTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface AttendanceRecord {
  date: string;
  studentId: string;
  isPresent: boolean;
  batchDay: string;
  batchTime: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
