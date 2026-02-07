import express, { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
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
    const { phoneNumber, code, deviceName, deviceType, firstName, lastName } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code required' });
    }

    // Verify OTP with Twilio
    const isValid = await verifyOTP(phoneNumber, code);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Check if user exists
    let user = await queryOne('SELECT * FROM users WHERE phone_number = ?', [phoneNumber]);
    let isNewUser = false;

    if (!user) {
      // Create new user with pending status
      const id = randomUUID();
      const name = [firstName, lastName].filter(Boolean).join(' ') || null;
      await run(
        `INSERT INTO users (id, phone_number, name, status, requested_at) VALUES (?, ?, ?, 'pending', datetime('now'))`,
        [id, phoneNumber, name]
      );
      user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
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
    await run(
      `INSERT INTO device_sessions (id, user_id, device_name, device_type, refresh_token, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, user.id, deviceName || 'Unknown', deviceType || 'mobile', refreshToken, req.ip, req.headers['user-agent']]
    );

    // Update user login stats
    await run("UPDATE users SET last_login_at = datetime('now'), login_count = login_count + 1 WHERE id = ?", [user.id]);

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

    const session = await queryOne('SELECT * FROM device_sessions WHERE refresh_token = ? AND is_active = 1', [refreshToken]);

    if (!session) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = ?', [session.user_id]);

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

    // Enforce 7-day inactivity limit
    const lastActive = new Date(session.last_active_at).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (now - lastActive > sevenDaysMs) {
      await run("UPDATE device_sessions SET is_active = 0 WHERE refresh_token = ?", [refreshToken]);
      return res.status(401).json({ error: 'Session expired due to inactivity' });
    }

    await run("UPDATE device_sessions SET refresh_token = ?, last_active_at = datetime('now') WHERE refresh_token = ?", [tokens.refreshToken, refreshToken]);

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
