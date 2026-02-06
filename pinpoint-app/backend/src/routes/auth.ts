import express, { Request, Response } from 'express';
import db from '../config/database';
import { sendOTP, verifyOTP } from '../utils/twilio';
import { generateTokens, TokenPayload } from '../utils/jwt';
import { randomUUID } from 'crypto';

const router = express.Router();

// Send OTP to phone number
router.post('/request-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const sent = await sendOTP(phoneNumber);

    if (!sent) {
      return res.status(500).json({ error: 'Failed to send OTP' });
    }

    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify OTP and authenticate
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code, deviceName, deviceType } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code required' });
    }

    // Verify OTP with Twilio
    const isValid = await verifyOTP(phoneNumber, code);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phoneNumber) as any;
    let isNewUser = false;

    if (!user) {
      // Create new user with pending status
      const id = randomUUID();
      db.prepare(
        `INSERT INTO users (id, phone_number, name, status, requested_at) VALUES (?, ?, ?, 'pending', datetime('now'))`
      ).run(id, phoneNumber, null);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      isNewUser = true;
    }

    // Check user status
    if (user.status === 'suspended' || user.status === 'inactive') {
      return res.status(403).json({ error: 'Account suspended', status: user.status });
    }

    // If pending, return pending status
    if (user.status === 'pending') {
      return res.json({
        success: true,
        status: 'pending',
        message: 'Account pending admin approval',
        user: {
          id: user.id,
          phoneNumber: user.phone_number,
          status: user.status,
          requestedAt: user.requested_at,
        },
      });
    }

    // User is approved - generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      phoneNumber: user.phone_number,
      role: user.role,
      status: user.status,
    };

    const { accessToken, refreshToken } = generateTokens(payload);

    // Store device session
    const sessionId = randomUUID();
    db.prepare(
      `INSERT INTO device_sessions (id, user_id, device_name, device_type, refresh_token, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(sessionId, user.id, deviceName || 'Unknown', deviceType || 'mobile', refreshToken, req.ip, req.headers['user-agent']);

    // Update user login stats
    db.prepare("UPDATE users SET last_login_at = datetime('now'), login_count = login_count + 1 WHERE id = ?").run(user.id);

    res.json({
      success: true,
      status: 'approved',
      tokens: { accessToken, refreshToken },
      user: {
        id: user.id,
        phoneNumber: user.phone_number,
        name: user.name,
        role: user.role,
        status: user.status,
      },
      isNewUser,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh access token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const session = db.prepare('SELECT * FROM device_sessions WHERE refresh_token = ? AND is_active = 1').get(refreshToken) as any;

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as any;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const payload: TokenPayload = {
      userId: user.id,
      phoneNumber: user.phone_number,
      role: user.role,
      status: user.status,
    };

    const tokens = generateTokens(payload);

    db.prepare("UPDATE device_sessions SET refresh_token = ?, last_active_at = datetime('now') WHERE refresh_token = ?").run(tokens.refreshToken, refreshToken);

    res.json({ tokens });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check auth status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.json({ authenticated: false });
    }

    const token = authHeader.substring(7);
    const { verifyAccessToken } = await import('../utils/jwt');
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: payload.userId,
        phoneNumber: payload.phoneNumber,
        role: payload.role,
        status: payload.status,
      },
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

export default router;
