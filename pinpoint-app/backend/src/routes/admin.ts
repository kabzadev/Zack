import express, { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { formatPhoneDisplay } from '../utils/twilio';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

const router = express.Router();

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

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

router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let rows: any[];
    if (status) {
      rows = await query('SELECT * FROM users WHERE status = ? ORDER BY created_at DESC', [status]);
    } else {
      rows = await query('SELECT * FROM users ORDER BY created_at DESC');
    }
    const users = rows.map((user: any) => ({
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
      estimatesCreated: user.estimates_created,
    }));
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users/pending', requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await query("SELECT * FROM users WHERE status = 'pending' ORDER BY requested_at DESC");
    const users = rows.map((user: any) => ({
      id: user.id,
      phoneNumber: formatPhoneDisplay(user.phone_number),
      rawPhoneNumber: user.phone_number,
      name: user.name,
      requestedAt: user.requested_at,
    }));
    res.json({ users });
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;
    const result = await run(
      "UPDATE users SET status = 'approved', approved_at = datetime('now'), approved_by = ? WHERE id = ? AND status = 'pending'",
      [adminId, id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found or not pending' });
    }
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'User approved successfully',
      user: { id: user.id, phoneNumber: formatPhoneDisplay(user.phone_number), status: user.status, approvedAt: user.approved_at },
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users/:id/decline', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await run(
      "UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ? AND status = 'pending'",
      [id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found or not pending' });
    }
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User declined', user: { id: user.id, phoneNumber: formatPhoneDisplay(user.phone_number), status: user.status } });
  } catch (error) {
    console.error('Decline user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users/:id/suspend', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await run(
      "UPDATE users SET status = 'suspended', updated_at = datetime('now') WHERE id = ? AND status = 'approved'",
      [id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found or not approved' });
    }
    await run('UPDATE device_sessions SET is_active = 0 WHERE user_id = ?', [id]);
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const totalRow = await queryOne('SELECT COUNT(*) as c FROM users');
    const activeRow = await queryOne("SELECT COUNT(*) as c FROM users WHERE status = 'approved'");
    const pendingRow = await queryOne("SELECT COUNT(*) as c FROM users WHERE status = 'pending'");
    const suspendedRow = await queryOne("SELECT COUNT(*) as c FROM users WHERE status = 'suspended'");
    res.json({
      total_users: Number(totalRow?.c || 0),
      active_users: Number(activeRow?.c || 0),
      pending_users: Number(pendingRow?.c || 0),
      suspended_users: Number(suspendedRow?.c || 0),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
