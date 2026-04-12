import { supabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('Category')
        .select('Name')
        .order('Name');
      if (error) throw error;
      return res.json(data.map((row) => row.Name));
    } catch (err) {
      console.error('GET /api/categories error:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
