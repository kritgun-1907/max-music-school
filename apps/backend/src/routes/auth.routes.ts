// apps/backend/src/routes/auth.routes.ts
import express, { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { googleSheetsService} from '../services/googleSheets.service';

const router = express.Router();
// const sheetsService = new GoogleSheetsService();

interface LoginRequest {
  email: string;
  password: string;
  role: 'student' | 'teacher';
}

interface TokenPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher';
}

// Generate access token
const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, secret as jwt.Secret, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m'
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined');
  }
  
  return jwt.sign(payload, secret as jwt.Secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
  } as jwt.SignOptions);
};

// POST /api/auth/login
router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    // Find user based on role
    let user;
    if (role === 'student') {
      user = await googleSheetsService.getStudentByEmail(email);
    } else {
      user = await googleSheetsService.getTeacherByEmail(email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await googleSheetsService.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id || user.email,
      email: user.email,
      role: role
    };

    // Generate tokens
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await googleSheetsService.storeRefreshToken(tokenPayload.userId, refreshToken);

    // Log the login activity
    await googleSheetsService.logActivity(
      'Login',
      tokenPayload.userId,
      `${role} logged in`,
      email
    );

    // Return tokens and user info
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: tokenPayload.userId,
        email: user.email,
        name: user.name,
        role: role
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

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, secret) as TokenPayload;

    // Verify refresh token is stored
    const isValid = await googleSheetsService.verifyRefreshToken(decoded.userId, refreshToken);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Store new refresh token
    await googleSheetsService.storeRefreshToken(decoded.userId, newRefreshToken);

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
  try {
    const { userId } = req.body;

    if (userId) {
      // Remove refresh token
      await googleSheetsService.removeRefreshToken(userId);
      
      // Log the logout activity
      await googleSheetsService.logActivity(
        'Logout',
        userId,
        'User logged out',
        ''
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;