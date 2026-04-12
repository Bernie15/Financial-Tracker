import { supabase } from '../../../_db.js';

export default async function handler(req, res) {
  const { tripId } = req.query;

  if (req.method === 'POST') {
    try {
      const { id, description, amount, category, date } = req.body;
      if (!description || !amount || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      const row = {
        Id: id,
        TripId: tripId,
        Description: description.trim().slice(0, 50),
        Amount: amount,
        Category: category.slice(0, 30),
        Date: new Date(date).toISOString(),
      };
      const { error } = await supabase.from('TravelExpense').insert(row);
      if (error) throw error;
      return res.status(201).json({ id, tripId, description, amount, category, date });
    } catch (err) {
      console.error('POST /api/trips/:tripId/expenses error:', err);
      return res.status(500).json({ error: 'Failed to add expense' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
