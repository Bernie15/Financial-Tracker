import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/transactions — return all transactions sorted newest first
router.get('/', async (_req, res) => {
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
    res.json(transactions);
  } catch (err) {
    console.error('GET /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions — add a new transaction
router.post('/', async (req, res) => {
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

    res.status(201).json({ id, description, amount, type, category, date });
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// DELETE /api/transactions/:id — delete a transaction by id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('Transaction')
      .delete()
      .eq('Id', id)
      .select();
    if (error) throw error;
    if (!data.length) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
