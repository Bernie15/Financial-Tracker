import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/categories — return all category names
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('category')
      .select('name')
      .order('name');
    if (error) throw error;
    res.json(data.map((row) => row.name));
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
