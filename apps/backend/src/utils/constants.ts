// apps/backend/src/utils/constants.ts

// Application Constants
export const APP_NAME = 'Max Music School';
export const API_VERSION = 'v1';

// Token Expiry Times
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';

// Redis Cache TTL (in seconds)
export const CACHE_TTL = {
  STUDENT: 300,      // 5 minutes
  TEACHER: 300,      // 5 minutes
  BATCH: 600,        // 10 minutes
  ATTENDANCE: 1800,  // 30 minutes
};

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  }
};

// Days of Week Mapping
export const DAY_MAP: { [key: string]: number } = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6
};

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Student Status
export const STUDENT_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  HOLD: 'Hold'
} as const;

// Teacher Status
export const TEACHER_STATUS = {
  ACTIVE: 'Active',
  HOLD: 'Hold'
} as const;

// Class Modes
export const CLASS_MODES = {
  ONLINE: 'Online',
  OFFLINE: 'Offline'
} as const;

// Log Actions
export const LOG_ACTIONS = {
  ATTENDANCE: 'Attendance',
  CHANGE_REQUEST: 'Change Request',
  REQUEST_APPROVED: 'Request Approved',
  REQUEST_REJECTED: 'Request Rejected',
  CLASS_RATING: 'Class Rating',
  LOGIN: 'Login',
  LOGOUT: 'Logout'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    ACCOUNT_INACTIVE: 'Account is not active',
    ACCOUNT_ON_HOLD: 'Account is on hold. Please clear pending payments.',
    TOKEN_REQUIRED: 'Authentication required',
    TOKEN_INVALID: 'Invalid or expired token',
    TOKEN_EXPIRED: 'Token has expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions'
  },
  STUDENT: {
    NOT_FOUND: 'Student not found',
    ALREADY_EXISTS: 'Student with this email already exists'
  },
  TEACHER: {
    NOT_FOUND: 'Teacher not found',
    NO_BATCHES: 'No batches assigned'
  },
  BATCH: {
    NOT_FOUND: 'Batch not found',
    INVALID_TIME: 'Invalid time format'
  },
  GENERAL: {
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    NOT_FOUND: 'Resource not found'
  }
};

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
    TOKEN_REFRESHED: 'Token refreshed successfully'
  },
  STUDENT: {
    ADDED: 'Student added successfully',
    UPDATED: 'Student updated successfully',
    PROFILE_UPDATED: 'Profile updated successfully'
  },
  ATTENDANCE: {
    MARKED: 'Attendance marked successfully'
  },
  REQUEST: {
    SUBMITTED: 'Request submitted successfully',
    APPROVED: 'Request approved successfully',
    REJECTED: 'Request rejected'
  },
  RATING: {
    SUBMITTED: 'Thank you for your feedback!'
  }
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
} as const;

// Google Sheets Column Mapping
export const SHEETS = {
  STUDENTS: 'Students',
  TEACHERS: 'Teachers',
  LOGS: 'Logs'
} as const;

// Student Columns (0-indexed)
export const STUDENT_COLUMNS = {
  ID: 0,
  NAME: 1,
  CONTACT: 2,
  EMAIL: 3,
  BATCH_NAME: 4,
  PASSWORD: 5,
  CLASS_DAYS: 6,
  TIME_FROM: 7,
  TIME_TILL: 8,
  SUBJECT: 9,
  COURSE: 10,
  MODE: 11,
  START_DATE: 12,
  END_DATE: 13,
  DAYS: 14,
  CLASSES: 15,
  STATUS: 16,
  TEACHER: 17,
  PAID_AMOUNT: 18,
  UPCOMING_AMOUNT: 19,
  UPCOMING_DAYS: 20,
  UPCOMING_CLASSES: 21,
  REP: 22,
  ATTENDANCE_PERCENTAGE: 23
} as const;

// Teacher Columns (0-indexed)
export const TEACHER_COLUMNS = {
  NAME: 0,
  CONTACT: 1,
  EMAIL: 2,
  PASSWORD: 3,
  SUBJECT: 4,
  STATUS: 5
} as const;

// Log Columns (0-indexed)
export const LOG_COLUMNS = {
  TIMESTAMP: 0,
  ACTION: 1,
  USER_ID: 2,
  DETAILS: 3,
  EXTRA: 4
} as const;