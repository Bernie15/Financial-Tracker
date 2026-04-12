import { supabase } from '../../../_db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'DELETE') {
    try {
      const { data, error } = await supabase
        .from('TravelExpense')
        .delete()
        .eq('Id', id)
        .select();
      if (error) throw error;
      if (!data.length) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      return res.json({ success: true });
    } catch (err) {
      console.error('DELETE /api/trips/:tripId/expenses/:id error:', err);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
