import { supabase } from './_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

      return res.json(result);
    } catch (err) {
      console.error('GET /api/trips error:', err);
      return res.status(500).json({ error: 'Failed to fetch trips' });
    }
  }

  if (req.method === 'POST') {
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
      return res.status(201).json({ id, name, destination, budget, startDate: startDate || null, endDate: endDate || null, expenses: [] });
    } catch (err) {
      console.error('POST /api/trips error:', err);
      return res.status(500).json({ error: 'Failed to create trip' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
