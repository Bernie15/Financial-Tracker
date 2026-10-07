import { useState, useEffect } from 'react';
import Header from './components/Header';
import Summary from './components/Summary';
import TransactionForm from './components/TransactionForm';
import ReceiptScanner from './components/ReceiptScanner';
import TransactionList from './components/TransactionList';
import CategoryChart from './components/CategoryChart';
import MonthlyReport from './components/MonthlyReport';
import TravelBudget from './components/TravelBudget';
import LoginScreen from './components/LoginScreen';
import API_BASE from './api';
import './App.css';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Load transactions from the database on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/transactions`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data = await res.json();
        if (!Array.isArray(data)) {
          throw new Error('The server returned an invalid transaction list');
        }

        setTransactions(data);
        setLoadError('');
      })
      .catch((err) => {
        console.error('Failed to load transactions:', err);
        setLoadError(err.message || 'Unable to load saved transactions');
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const handleAdd = async (transaction) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      if (!res.ok) throw new Error('Failed to add transaction');
      const saved = await res.json();
      setTransactions((prev) => [saved, ...prev]);
    } catch (err) {
      console.error('Add transaction error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction');
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Delete transaction error:', err);
    }
  };

  return (
    <div className="app">
      {!authenticated ? (
        <LoginScreen onLogin={() => setAuthenticated(true)} />
      ) : (
        <>
          {/* Z-Pattern Row 1: Logo ←→ Date */}
          <Header />

          {loadError && (
            <div className="load-error" role="alert">
              <span>
                Could not load saved transactions. Make sure the API server is running
                (`npm run server`), then retry. ({loadError})
              </span>
              <button
                type="button"
                className="retry-btn"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Z-Pattern Diagonal: Summary cards spanning full width */}
          <Summary balance={balance} income={income} expenses={expenses} />

          {/* Z-Pattern Row 2: Form ←→ History */}
          <main className="main-grid">
            <div className="form-column">
              <TransactionForm onAdd={handleAdd} />
              <ReceiptScanner onAdd={handleAdd} />
            </div>
            <TransactionList
              transactions={transactions}
              onDelete={handleDelete}
              loading={loading}
            />
          </main>

          {/* Charts: Pie charts side by side */}
          <section className="charts-grid">
            <CategoryChart transactions={transactions} type="expense" />
            <CategoryChart transactions={transactions} type="income" />
          </section>

          {/* Travel Budget Planner */}
          <TravelBudget />

          {/* Monthly Summary Report */}
          <MonthlyReport transactions={transactions} />
        </>
      )}
    </div>
  );
}

export default App;
