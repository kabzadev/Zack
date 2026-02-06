import express, { Request, Response } from 'express';
import pool from '../config/database';
import { formatPhoneDisplay } from '../utils/twilio';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

const router = express.Router();

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// Middleware to check if user is admin
const requireAdmin = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    (req as Request & { user: TokenPayload }).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all users with filters
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM users';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    
    const users = result.rows.map(user => ({
      id: user.id,
      phoneNumber: formatPhoneDisplay(user.phone_number),
      rawPhoneNumber: user.phone_number,
      name: user.name,
      role: user.role,
      status: user.status,
      requestedAt: user.requested_at,
      approvedAt: user.approved_at,
      lastLoginAt: user.last_login_at,
      loginCount: user.login_count,
      estimatesCreated: user.estimates_created
    }));
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get pending users
router.get('/users/pending', requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE status = $1 ORDER BY requested_at DESC',
      ['pending']
    );
    
    const users = result.rows.map(user => ({
      id: user.id,
      phoneNumber: formatPhoneDisplay(user.phone_number),
      rawPhoneNumber: user.phone_number,
      name: user.name,
      requestedAt: user.requested_at
    }));
    
    res.json({ users });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve user
router.post('/users/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;
    
    const result = await pool.query(
      `UPDATE users 
       SET status = 'approved', approved_at = CURRENT_TIMESTAMP, approved_by = $1 
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [adminId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or not pending' });
    }
    
    const user = result.rows[0];
    
    // TODO: Send SMS notification to user
    
    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: user.id,
        phoneNumber: formatPhoneDisplay(user.phone_number),
        status: user.status,
        approvedAt: user.approved_at
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Decline user
router.post('/users/:id/decline', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE users 
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or not pending' });
    }
    
    const user = result.rows[0];
    
    // TODO: Send SMS notification to user
    
    res.json({
      success: true,
      message: 'User declined',
      user: {
        id: user.id,
        phoneNumber: formatPhoneDisplay(user.phone_number),
        status: user.status
      }
    });
  } catch (error) {
    console.error('Decline user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Suspend user
router.post('/users/:id/suspend', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE users 
       SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'approved'
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found or not approved' });
    }
    
    // Deactivate all device sessions
    await pool.query(
      'UPDATE device_sessions SET is_active = false WHERE user_id = $1',
      [id]
    );
    
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'approved') as active_users,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE last_login_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as active_today
      FROM users
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;