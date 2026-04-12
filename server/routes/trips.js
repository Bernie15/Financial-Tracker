import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// ── Trips ──────────────────────────────────────────

// GET /api/trips — all trips with their expenses
router.get('/', async (_req, res) => {
  try {
    const { data: trips, error: tripErr } = await supabase
      .from('travel_trip')
      .select('*')
      .order('created_at', { ascending: false });
    if (tripErr) throw tripErr;

    const { data: expenses, error: expErr } = await supabase
      .from('travel_expense')
      .select('*')
      .order('date', { ascending: false });
    if (expErr) throw expErr;

    const expMap = {};
    for (const ex of expenses) {
      if (!expMap[ex.trip_id]) expMap[ex.trip_id] = [];
      expMap[ex.trip_id].push({
        id: ex.id,
        tripId: ex.trip_id,
        description: ex.description,
        amount: parseFloat(ex.amount),
        category: ex.category,
        date: ex.date,
      });
    }

    const result = trips.map((t) => ({
      id: t.id,
      name: t.name,
      destination: t.destination,
      budget: parseFloat(t.budget),
      startDate: t.start_date,
      endDate: t.end_date,
      createdAt: t.created_at,
      expenses: expMap[t.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /api/trips error:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// POST /api/trips — create a trip
router.post('/', async (req, res) => {
  try {
    const { id, name, destination, budget, startDate, endDate } = req.body;

    if (!name || !destination || !budget) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof budget !== 'number' || budget <= 0) {
      return res.status(400).json({ error: 'Budget must be a positive number' });
    }

    const row = {
      id,
      name: name.trim().slice(0, 40),
      destination: destination.trim().slice(0, 40),
      budget,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    const { error } = await supabase.from('travel_trip').insert(row);
    if (error) throw error;

    res.status(201).json({ id, name, destination, budget, startDate: startDate || null, endDate: endDate || null, expenses: [] });
  } catch (err) {
    console.error('POST /api/trips error:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// DELETE /api/trips/:id — delete a trip (cascade deletes expenses)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('travel_trip')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data.length) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/trips error:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// ── Trip Expenses ──────────────────────────────────

// POST /api/trips/:tripId/expenses — add an expense to a trip
router.post('/:tripId/expenses', async (req, res) => {
  try {
    const { tripId } = req.params;
    const { id, description, amount, category, date } = req.body;

    if (!description || !amount || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    const row = {
      id,
      trip_id: tripId,
      description: description.trim().slice(0, 50),
      amount,
      category: category.slice(0, 30),
      date: new Date(date).toISOString(),
    };

    const { error } = await supabase.from('travel_expense').insert(row);
    if (error) throw error;

    res.status(201).json({ id, tripId, description, amount, category, date });
  } catch (err) {
    console.error('POST /api/trips/:tripId/expenses error:', err);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// DELETE /api/trips/:tripId/expenses/:id — delete an expense
router.delete('/:tripId/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('travel_expense')
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data.length) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/trips/expenses error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
