// apps/backend/src/utils/helpers.ts
import bcrypt from 'bcryptjs';
import { DAY_MAP, DAY_NAMES } from './constants';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hashed password
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  // Handle unhashed passwords (for demo/development)
  if (!hashedPassword.startsWith('$2')) {
    return plainPassword === hashedPassword;
  }
  return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Calculate the next class date based on class days
 */
export const calculateNextClassDate = (classDays: string): Date => {
  const days = classDays.split('-').map(day => day.trim());
  const today = new Date();
  const currentDay = today.getDay();
  
  const classDayNumbers = days.map(day => DAY_MAP[day]).filter(d => d !== undefined);
  
  // Find next class day
  let nextDay = classDayNumbers.find(day => day > currentDay);
  
  if (!nextDay && classDayNumbers.length > 0) {
    nextDay = classDayNumbers[0]; // Next week
  }
  
  if (!nextDay) {
    // Default to tomorrow if no valid days
    nextDay = currentDay + 1;
  }
  
  const daysUntilNext = (nextDay - currentDay + 7) % 7 || 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  
  return nextDate;
};

/**
 * Get today's schedule from batches
 */
export const getTodaySchedule = (batches: any[]): any[] => {
  const today = new Date();
  const todayName = DAY_NAMES[today.getDay()];
  
  return batches
    .filter(batch => batch.classDays.includes(todayName))
    .map(batch => ({
      batchName: batch.batchName,
      timing: `${batch.timeFrom} - ${batch.timeTill}`,
      studentCount: batch.students?.length || 0,
      mode: batch.mode,
      subject: batch.subject
    }));
};

/**
 * Calculate total classes from date range and class days
 */
export const calculateTotalClasses = (
  startDate: string,
  endDate: string,
  classDays: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const classDaysCount = classDays.split('-').length;
  const weeksCount = Math.ceil(daysDiff / 7);
  
  return weeksCount * classDaysCount;
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format time to HH:MM AM/PM
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Parse time range (e.g., "9:00-10:00" to {from: "9:00", till: "10:00"})
 */
export const parseTimeRange = (timeRange: string): { from: string; till: string } => {
  const [from, till] = timeRange.split('-').map(t => t.trim());
  return { from, till };
};

/**
 * Generate unique student ID
 */
export const generateStudentId = (): string => {
  return `STU${Date.now()}`;
};

/**
 * Generate unique request ID
 */
export const generateRequestId = (): string => {
  return `REQ${Date.now()}`;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Calculate attendance percentage
 */
export const calculateAttendancePercentage = (
  presentCount: number,
  totalCount: number
): number => {
  if (totalCount === 0) return 100;
  return Math.round((presentCount / totalCount) * 100);
};

/**
 * Get days until date
 */
export const getDaysUntil = (targetDate: string): number => {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: string): boolean => {
  return new Date(date) < new Date();
};

/**
 * Get current timestamp in ISO format
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Parse month and year from query
 */
export const parseMonthYear = (
  month?: string,
  year?: string
): { month?: number; year?: number } => {
  return {
    month: month ? parseInt(month) : undefined,
    year: year ? parseInt(year) : undefined
  };
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Map<any, T[]> => {
  return array.reduce((map, item) => {
    const keyValue = item[key];
    const group = map.get(keyValue) || [];
    group.push(item);
    map.set(keyValue, group);
    return map;
  }, new Map());
};

/**
 * Sleep for specified milliseconds (for testing/delays)
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry async function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined/null values from object
 */
export const removeNullish = (obj: any): any => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null)
  );
};

/**
 * Get error message from unknown error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Check if string is valid date
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};