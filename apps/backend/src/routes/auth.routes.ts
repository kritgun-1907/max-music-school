// apps/backend/src/routes/auth.routes.ts
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { googleSheetsService } from '../services/googleSheets.service';

const router = express.Router();

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
}

// Generate access token
const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });
};

// Generate refresh token
const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in Google Sheets
    const students = await googleSheetsService.getStudents();
    const user = students.find((s: any) => s.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (in production, use hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id || user.email,
      email: user.email,
      role: user.role || 'student'
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Return tokens and user info
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: tokenPayload.userId,
        email: user.email,
        name: user.name,
        role: tokenPayload.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as TokenPayload;

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  // In a production app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

export default router;
