import { useState, useEffect } from 'react';

const TRAVEL_CATEGORIES = [
  '✈️ Flights',
  '🏨 Accommodation',
  '🍽️ Food & Drinks',
  '🚕 Transportation',
  '🎟️ Activities',
  '🛍️ Shopping',
  '📱 Communication',
  '📋 Other',
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

function TravelBudget() {
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);

  // New trip form
  const [tripName, setTripName] = useState('');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // New expense form
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState(TRAVEL_CATEGORIES[0]);

  // Load trips from the database on mount
  useEffect(() => {
    fetch('/api/trips')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTrips(data);
      })
      .catch((err) => console.error('Failed to load trips:', err));
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (val && val < today) {
      setDateError('Dates cannot be in the past');
    } else if (val && endDate && val > endDate) {
      setDateError('From date cannot be later than To date');
    } else if (endDate && endDate < today) {
      setDateError('Dates cannot be in the past');
    } else {
      setDateError('');
    }
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    if (val && val < today) {
      setDateError('Dates cannot be in the past');
    } else if (startDate && val && startDate > val) {
      setDateError('From date cannot be later than To date');
    } else if (startDate && startDate < today) {
      setDateError('Dates cannot be in the past');
    } else {
      setDateError('');
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    const parsedBudget = parseFloat(budget);
    if (!tripName.trim() || !destination.trim() || isNaN(parsedBudget) || parsedBudget <= 0) return;
    if ((startDate && startDate < today) || (endDate && endDate < today)) {
      setDateError('Dates cannot be in the past');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      setDateError('From date cannot be later than To date');
      return;
    }

    const trip = {
      id: crypto.randomUUID(),
      name: tripName.trim(),
      destination: destination.trim(),
      budget: parsedBudget,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trip),
      });
      if (!res.ok) throw new Error('Failed to create trip');
      const saved = await res.json();
      setTrips((prev) => [{ ...saved, expenses: [] }, ...prev]);
      setActiveTrip(saved.id);
      setTripName('');
      setDestination('');
      setBudget('');
      setStartDate('');
      setEndDate('');
      setDateError('');
    } catch (err) {
      console.error('Create trip error:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const expense = {
      id: crypto.randomUUID(),
      description: expDesc.trim(),
      amount: parsedAmount,
      category: expCategory,
      date: new Date().toISOString(),
    };

    try {
      const res = await fetch(`/api/trips/${activeTrip}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense),
      });
      if (!res.ok) throw new Error('Failed to add expense');

      setTrips((prev) =>
        prev.map((t) =>
          t.id === activeTrip ? { ...t, expenses: [expense, ...t.expenses] } : t
        )
      );
      setExpDesc('');
      setExpAmount('');
      setExpCategory(TRAVEL_CATEGORIES[0]);
    } catch (err) {
      console.error('Add expense error:', err);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const res = await fetch(`/api/trips/${activeTrip}/expenses/${expenseId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete expense');
      setTrips((prev) =>
        prev.map((t) =>
          t.id === activeTrip
            ? { ...t, expenses: t.expenses.filter((ex) => ex.id !== expenseId) }
            : t
        )
      );
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete trip');
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (activeTrip === tripId) setActiveTrip(null);
    } catch (err) {
      console.error('Delete trip error:', err);
    }
  };

  const current = trips.find((t) => t.id === activeTrip);
  const totalSpent = current ? current.expenses.reduce((s, ex) => s + ex.amount, 0) : 0;
  const remaining = current ? current.budget - totalSpent : 0;
  const pct = current ? Math.min((totalSpent / current.budget) * 100, 100) : 0;

  // Group expenses by category for the active trip
  const categoryBreakdown = current
    ? TRAVEL_CATEGORIES.map((cat) => {
        const catTotal = current.expenses
          .filter((ex) => ex.category === cat)
          .reduce((s, ex) => s + ex.amount, 0);
        return { category: cat, total: catTotal };
      }).filter((c) => c.total > 0)
    : [];

  return (
    <section className="travel-section">
      <h2 className="section-title">Travel Budget</h2>

      {/* Trip selector + create */}
      <div className="travel-layout">
        {/* Left: trip list & create form */}
        <div className="travel-sidebar">
          <form className="travel-create-form" onSubmit={handleCreateTrip}>
            <input
              type="text"
              placeholder="Trip name"
              value={tripName}
              onChange={(e) => setTripName(e.target.value)}
              className="form-input"
              maxLength={40}
              required
            />
            <input
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="form-input"
              maxLength={40}
              required
            />
            <input
              type="number"
              placeholder="Budget (₱)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="form-input"
              min="1"
              step="0.01"
              required
            />
            <div className="travel-date-row">
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={handleStartDateChange}
                className={`form-input ${dateError ? 'input-error' : ''}`}
              />
              <span className="travel-date-sep">→</span>
              <input
                type="date"
                value={endDate}
                min={startDate || today}
                onChange={handleEndDateChange}
                className={`form-input ${dateError ? 'input-error' : ''}`}
              />
            </div>
            {dateError && <p className="travel-date-error">{dateError}</p>}
            <button type="submit" className="submit-btn">
              + New Trip
            </button>
          </form>

          {trips.length > 0 && (
            <ul className="travel-trip-list">
              {trips.map((t) => {
                const spent = t.expenses.reduce((s, ex) => s + ex.amount, 0);
                const pctUsed = Math.min((spent / t.budget) * 100, 100);
                return (
                  <li
                    key={t.id}
                    className={`travel-trip-item ${activeTrip === t.id ? 'active' : ''}`}
                    onClick={() => setActiveTrip(t.id)}
                  >
                    <div className="travel-trip-header">
                      <span className="travel-trip-name">{t.name}</span>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(t.id);
                        }}
                        title="Delete trip"
                      >
                        ×
                      </button>
                    </div>
                    <span className="travel-trip-dest">📍 {t.destination}</span>
                    <div className="travel-mini-bar">
                      <div
                        className={`travel-mini-fill ${pctUsed > 90 ? 'over' : ''}`}
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                    <span className="travel-trip-budget">
                      {formatCurrency(spent)} / {formatCurrency(t.budget)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right: active trip detail */}
        <div className="travel-detail">
          {!current ? (
            <div className="travel-empty">
              {trips.length === 0
                ? 'Create your first trip to start tracking travel expenses.'
                : 'Select a trip from the list.'}
            </div>
          ) : (
            <>
              {/* Budget overview */}
              <div className="travel-overview">
                <div className="travel-overview-header">
                  <div>
                    <h3 className="travel-detail-title">{current.name}</h3>
                    <span className="travel-detail-dest">📍 {current.destination}</span>
                    {current.startDate && (
                      <span className="travel-detail-dates">
                        {current.startDate}
                        {current.endDate ? ` → ${current.endDate}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="travel-budget-cards">
                  <div className="travel-stat">
                    <span className="travel-stat-label">Budget</span>
                    <span className="travel-stat-value">{formatCurrency(current.budget)}</span>
                  </div>
                  <div className="travel-stat">
                    <span className="travel-stat-label">Spent</span>
                    <span className="travel-stat-value spent">{formatCurrency(totalSpent)}</span>
                  </div>
                  <div className="travel-stat">
                    <span className="travel-stat-label">Remaining</span>
                    <span className={`travel-stat-value ${remaining < 0 ? 'over-budget' : 'remaining'}`}>
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                </div>

                <div className="travel-bar">
                  <div
                    className={`travel-bar-fill ${pct > 90 ? 'over' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="travel-bar-label">{pct.toFixed(0)}% used</span>
              </div>

              {/* Category breakdown */}
              {categoryBreakdown.length > 0 && (
                <div className="travel-categories">
                  <h4 className="travel-sub-title">By Category</h4>
                  <ul className="travel-cat-list">
                    {categoryBreakdown.map((c) => (
                      <li key={c.category} className="travel-cat-item">
                        <span className="travel-cat-name">{c.category}</span>
                        <span className="travel-cat-amount">{formatCurrency(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add expense */}
              <form className="travel-expense-form" onSubmit={handleAddExpense}>
                <h4 className="travel-sub-title">Add Expense</h4>
                <div className="travel-expense-row">
                  <input
                    type="text"
                    placeholder="Description"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="form-input"
                    maxLength={50}
                    required
                  />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="form-input"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="travel-expense-row">
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="form-select"
                  >
                    {TRAVEL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button type="submit" className="submit-btn">
                    + Add
                  </button>
                </div>
              </form>

              {/* Expense list */}
              {current.expenses.length > 0 && (
                <div className="travel-expenses">
                  <h4 className="travel-sub-title">Expenses</h4>
                  <ul className="travel-expense-list">
                    {current.expenses.map((ex) => (
                      <li key={ex.id} className="travel-expense-item">
                        <div className="travel-expense-info">
                          <span className="travel-expense-desc">{ex.description}</span>
                          <span className="travel-expense-meta">
                            {ex.category} · {new Date(ex.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <span className="travel-expense-amount">{formatCurrency(ex.amount)}</span>
                        <button
                          type="button"
                          className="delete-btn"
                          onClick={() => handleDeleteExpense(ex.id)}
                          title="Delete expense"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default TravelBudget;
