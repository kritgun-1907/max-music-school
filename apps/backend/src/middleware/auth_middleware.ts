// apps/backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Token payload schema
const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  role: z.enum(['student', 'teacher', 'admin']),
  exp: z.number(),
  iat: z.number()
});

export interface AuthRequest extends Request {
  user?: z.infer<typeof TokenPayloadSchema>;
}

class AuthService {
  private readonly ACCESS_TOKEN_SECRET: string;
  private readonly REFRESH_TOKEN_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor() {
    this.ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-key';
    this.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
  }

  // Generate Access Token
  generateAccessToken(payload: Omit<z.infer<typeof TokenPayloadSchema>, 'exp' | 'iat'>): string {
    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
  }

  // Generate Refresh Token
  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY
    });
  }

  // Verify Access Token
  verifyAccessToken(token: string): z.infer<typeof TokenPayloadSchema> | null {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET);
      return TokenPayloadSchema.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  // Verify Refresh Token
  verifyRefreshToken(token: string): { userId: string } | null {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();

// Authentication Middleware
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = authService.verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Role-based Access Control Middleware
export const authorize = (...roles: Array<'student' | 'teacher' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

// Rate Limiting Middleware
import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF Protection
import crypto from 'crypto';

export class CSRFProtection {
  private tokens = new Map<string, { token: string; expires: number }>();

  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour
    
    this.tokens.set(sessionId, { token, expires });
    this.cleanupExpiredTokens();
    
    return token;
  }

  verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored || stored.expires < Date.now()) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(stored.token),
      Buffer.from(token)
    );
  }

  private cleanupExpiredTokens() {
    const now = Date.now();
    for (const [sessionId, { expires }] of this.tokens.entries()) {
      if (expires < now) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

export const csrfProtection = new CSRFProtection();

// Input Validation Middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.errors
        });
      } else {
        res.status(400).json({ error: 'Invalid request data' });
      }
    }
  };
};

// Security Headers Middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Prevent XSS attacks
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  
  next();
};