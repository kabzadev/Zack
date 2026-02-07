import express, { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { verifyAccessToken } from '../utils/jwt';

const router = express.Router();

// ─── Middleware: Require Auth ───
const authenticate = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid token' });
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Routes ───

// GET /api/estimates - Fetch owned + shared estimates
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user;
    
    let estimates;
    if (role === 'admin') {
      // Admins see everything, with customer names and creator names
      estimates = await query(`
        SELECT e.*, c.first_name, c.last_name, u.name as creator_name
        FROM estimates e
        JOIN customers c ON e.customer_id = c.id
        JOIN users u ON e.created_by = u.id
        ORDER BY e.created_at DESC
      `);
    } else {
      // Estimators see owned + shared
      estimates = await query(`
        SELECT e.*, c.first_name, c.last_name
        FROM estimates e
        JOIN customers c ON e.customer_id = c.id
        LEFT JOIN estimate_shares s ON e.id = s.estimate_id
        WHERE e.created_by = $1 OR s.shared_with = $1
        ORDER BY e.created_at DESC
      `, [userId]);
    }
    
    res.json(estimates);
  } catch (error) {
    console.error('Fetch estimates error:', error);
    res.status(500).json({ error: 'Failed to fetch estimates' });
  }
});

// POST /api/estimates/:id/share - Share with another user
router.post('/:id/share', authenticate, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { sharedWithUserId, permission } = req.body;
    
    await run(
      `INSERT INTO estimate_shares (estimate_id, shared_with, permission) 
       VALUES ($1, $2, $3) ON CONFLICT (estimate_id, shared_with) DO UPDATE SET permission = $3`,
      [id, sharedWithUserId, permission || 'view']
    );
    
    res.json({ success: true, message: 'Estimate shared' });
  } catch (error) {
    console.error('Sharing error:', error);
    res.status(500).json({ error: 'Failed to share estimate' });
  }
});

export default router;
