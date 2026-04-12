import { useState, useEffect } from 'react';
import API_BASE from '../api';

const FALLBACK_CATEGORIES = [
  'Education',
  'Entertainment',
  'Food & Dining',
  'Freelance',
  'Healthcare',
  'Housing',
  'Investments',
  'Other',
  'Salary',
  'Savings',
  'Shopping',
  'Transportation',
  'Utilities',
];

function TransactionForm({ onAdd }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Other');
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    fetch(`${API_BASE}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
          setCategory(data.includes('Other') ? 'Other' : data[0]);
        }
      })
      .catch(() => {/* keep fallback categories */});
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAdd({
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      date: new Date().toISOString(),
    });

    setDescription('');
    setAmount('');
    setType('expense');
    setCategory('Other');
  };

  return (
    <section className="form-section">
      <h2 className="section-title">Add Transaction</h2>
      <form className="transaction-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            maxLength={60}
            required
          />
        </div>
        <div className="form-row form-row-split">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input"
            min="0.01"
            step="0.01"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="form-select"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row type-toggle">
          <button
            type="button"
            className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
            onClick={() => setType('income')}
          >
            Income
          </button>
          <button
            type="button"
            className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
            onClick={() => setType('expense')}
          >
            Expense
          </button>
        </div>
        <button type="submit" className="submit-btn">
          Add {type === 'income' ? 'Income' : 'Expense'}
        </button>
      </form>
    </section>
  );
}

export default TransactionForm;
