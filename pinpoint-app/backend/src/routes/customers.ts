import express, { Request, Response } from 'express';
import { query, queryOne, run } from '../config/database';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';

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

// GET /api/customers - List all or owned customers
router.get('/', authenticate, async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user;
    let customers;
    
    if (role === 'admin') {
      customers = await query('SELECT * FROM customers ORDER BY last_name ASC');
    } else {
      customers = await query('SELECT * FROM customers WHERE created_by = $1 ORDER BY last_name ASC', [userId]);
    }
    
    res.json(customers);
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// POST /api/customers - Create a new customer
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    const { userId } = req.user;
    const { firstName, lastName, email, phone, address, city, state, zipCode, type, notes, tags } = req.body;

    const result = await query(
      `INSERT INTO customers (first_name, last_name, email, phone, address, city, state, zip_code, type, notes, tags, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [firstName, lastName, email, phone, address, city, state, zipCode, type || 'homeowner', notes, JSON.stringify(tags || []), userId]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// DELETE /api/customers/:id - ADMIN ONLY
router.delete('/:id', authenticate, async (req: any, res: Response) => {
  try {
    const { role } = req.user;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete customers' });
    }

    const { id } = req.params;
    await run('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

export default router;
