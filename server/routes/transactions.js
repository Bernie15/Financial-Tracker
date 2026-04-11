import { Router } from 'express';
import { getPool, sql } from '../db.js';

const router = Router();

// GET /api/transactions — return all transactions sorted newest first
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(
      'SELECT Id, Description, Amount, Type, Category, Date FROM [Transaction] ORDER BY Date DESC'
    );
    const transactions = result.recordset.map((row) => ({
      id: row.Id,
      description: row.Description,
      amount: parseFloat(row.Amount),
      type: row.Type,
      category: row.Category,
      date: row.Date.toISOString(),
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

    const pool = await getPool();
    await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('Description', sql.NVarChar(60), description.trim().slice(0, 60))
      .input('Amount', sql.Decimal(18, 2), amount)
      .input('Type', sql.NVarChar(10), type)
      .input('Category', sql.NVarChar(50), category)
      .input('Date', sql.DateTime2, new Date(date))
      .query(
        'INSERT INTO [Transaction] (Id, Description, Amount, Type, Category, Date) VALUES (@Id, @Description, @Amount, @Type, @Category, @Date)'
      );

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
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('DELETE FROM [Transaction] WHERE Id = @Id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/transactions error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
