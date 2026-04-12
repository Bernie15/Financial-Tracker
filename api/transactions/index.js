import { supabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('Transaction')
        .select('Id, Description, Amount, Type, Category, Date')
        .order('Date', { ascending: false });
      if (error) throw error;
      const transactions = data.map((row) => ({
        id: row.Id,
        description: row.Description,
        amount: parseFloat(row.Amount),
        type: row.Type,
        category: row.Category,
        date: row.Date,
      }));
      return res.json(transactions);
    } catch (err) {
      console.error('GET /api/transactions error:', err);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { id, description, amount, type, category, date } = req.body;
      if (!description || !amount || !type || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ error: 'Type must be income or expense' });
      }
      if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
      const row = {
        Id: id,
        Description: description.trim().slice(0, 60),
        Amount: amount,
        Type: type,
        Category: category,
        Date: new Date(date).toISOString(),
      };
      const { error } = await supabase.from('Transaction').insert(row);
      if (error) throw error;
      return res.status(201).json({ id, description, amount, type, category, date });
    } catch (err) {
      console.error('POST /api/transactions error:', err);
      return res.status(500).json({ error: 'Failed to add transaction' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
