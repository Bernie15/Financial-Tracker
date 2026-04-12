import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// ── Trips ──────────────────────────────────────────

// GET /api/trips — all trips with their expenses
router.get('/', async (_req, res) => {
  try {
    const { data: trips, error: tripErr } = await supabase
      .from('TravelTrip')
      .select('*')
      .order('CreatedAt', { ascending: false });
    if (tripErr) throw tripErr;

    const { data: expenses, error: expErr } = await supabase
      .from('TravelExpense')
      .select('*')
      .order('Date', { ascending: false });
    if (expErr) throw expErr;

    const expMap = {};
    for (const ex of expenses) {
      if (!expMap[ex.TripId]) expMap[ex.TripId] = [];
      expMap[ex.TripId].push({
        id: ex.Id,
        tripId: ex.TripId,
        description: ex.Description,
        amount: parseFloat(ex.Amount),
        category: ex.Category,
        date: ex.Date,
      });
    }

    const result = trips.map((t) => ({
      id: t.Id,
      name: t.Name,
      destination: t.Destination,
      budget: parseFloat(t.Budget),
      startDate: t.StartDate,
      endDate: t.EndDate,
      createdAt: t.CreatedAt,
      expenses: expMap[t.Id] || [],
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
      Id: id,
      Name: name.trim().slice(0, 40),
      Destination: destination.trim().slice(0, 40),
      Budget: budget,
      StartDate: startDate || null,
      EndDate: endDate || null,
    };

    const { error } = await supabase.from('TravelTrip').insert(row);
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
      .from('TravelTrip')
      .delete()
      .eq('Id', id)
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
      Id: id,
      TripId: tripId,
      Description: description.trim().slice(0, 50),
      Amount: amount,
      Category: category.slice(0, 30),
      Date: new Date(date).toISOString(),
    };

    const { error } = await supabase.from('TravelExpense').insert(row);
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
      .from('TravelExpense')
      .delete()
      .eq('Id', id)
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
