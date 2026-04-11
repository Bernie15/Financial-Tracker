import { Router } from 'express';
import { getPool } from '../db.js';

const router = Router();

// GET /api/categories — return all category names
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT Name FROM Category ORDER BY Name');
    const categories = result.recordset.map((row) => row.Name);
    res.json(categories);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
