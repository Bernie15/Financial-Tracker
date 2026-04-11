import { Router } from 'express';
import { getPool, sql } from '../db.js';

const router = Router();

// ── Trips ──────────────────────────────────────────

// GET /api/trips — all trips with their expenses
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const trips = await pool.request().query(
      'SELECT Id, Name, Destination, Budget, StartDate, EndDate, CreatedAt FROM TravelTrip ORDER BY CreatedAt DESC'
    );
    const expenses = await pool.request().query(
      'SELECT Id, TripId, Description, Amount, Category, Date FROM TravelExpense ORDER BY Date DESC'
    );

    const expMap = {};
    for (const ex of expenses.recordset) {
      const tid = ex.TripId;
      if (!expMap[tid]) expMap[tid] = [];
      expMap[tid].push({
        id: ex.Id,
        tripId: tid,
        description: ex.Description,
        amount: parseFloat(ex.Amount),
        category: ex.Category,
        date: ex.Date.toISOString(),
      });
    }

    const result = trips.recordset.map((t) => ({
      id: t.Id,
      name: t.Name,
      destination: t.Destination,
      budget: parseFloat(t.Budget),
      startDate: t.StartDate ? t.StartDate.toISOString().slice(0, 10) : null,
      endDate: t.EndDate ? t.EndDate.toISOString().slice(0, 10) : null,
      createdAt: t.CreatedAt.toISOString(),
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

    const pool = await getPool();
    await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('Name', sql.NVarChar(40), name.trim().slice(0, 40))
      .input('Destination', sql.NVarChar(40), destination.trim().slice(0, 40))
      .input('Budget', sql.Decimal(18, 2), budget)
      .input('StartDate', sql.Date, startDate || null)
      .input('EndDate', sql.Date, endDate || null)
      .query(
        'INSERT INTO TravelTrip (Id, Name, Destination, Budget, StartDate, EndDate) VALUES (@Id, @Name, @Destination, @Budget, @StartDate, @EndDate)'
      );

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
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('DELETE FROM TravelTrip WHERE Id = @Id');

    if (result.rowsAffected[0] === 0) {
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

    const pool = await getPool();
    await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .input('TripId', sql.UniqueIdentifier, tripId)
      .input('Description', sql.NVarChar(50), description.trim().slice(0, 50))
      .input('Amount', sql.Decimal(18, 2), amount)
      .input('Category', sql.NVarChar(30), category.slice(0, 30))
      .input('Date', sql.DateTime2, new Date(date))
      .query(
        'INSERT INTO TravelExpense (Id, TripId, Description, Amount, Category, Date) VALUES (@Id, @TripId, @Description, @Amount, @Category, @Date)'
      );

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
    const pool = await getPool();
    const result = await pool
      .request()
      .input('Id', sql.UniqueIdentifier, id)
      .query('DELETE FROM TravelExpense WHERE Id = @Id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/trips/expenses error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
