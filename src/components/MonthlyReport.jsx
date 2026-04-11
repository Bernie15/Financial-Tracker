import { useState, useMemo } from 'react';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

function getMonthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function MonthlyReport({ transactions }) {
  const months = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const key = getMonthKey(t.date);
      if (!map[key]) map[key] = { income: 0, expenses: 0, categories: {} };
      if (t.type === 'income') {
        map[key].income += t.amount;
      } else {
        map[key].expenses += t.amount;
      }
      if (t.type === 'expense') {
        map[key].categories[t.category] =
          (map[key].categories[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, data]) => ({
        key,
        label: getMonthLabel(key),
        ...data,
        net: data.income - data.expenses,
        topCategories: Object.entries(data.categories)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3),
      }));
  }, [transactions]);

  const [expanded, setExpanded] = useState(null);

  if (months.length === 0) {
    return (
      <section className="report-section">
        <h2 className="section-title">Monthly Report</h2>
        <p className="empty-state">No data to report</p>
      </section>
    );
  }

  return (
    <section className="report-section">
      <h2 className="section-title">Monthly Report</h2>
      <div className="month-list">
        {months.map((m) => (
          <div
            key={m.key}
            className={`month-card ${expanded === m.key ? 'expanded' : ''}`}
          >
            <button
              className="month-header"
              onClick={() => setExpanded(expanded === m.key ? null : m.key)}
            >
              <span className="month-label">{m.label}</span>
              <span className={`month-net ${m.net >= 0 ? 'positive' : 'negative'}`}>
                {m.net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(m.net))}
              </span>
            </button>
            {expanded === m.key && (
              <div className="month-details">
                <div className="month-row">
                  <span className="month-detail-label">Income</span>
                  <span className="month-detail-value positive">
                    {formatCurrency(m.income)}
                  </span>
                </div>
                <div className="month-row">
                  <span className="month-detail-label">Expenses</span>
                  <span className="month-detail-value negative">
                    {formatCurrency(m.expenses)}
                  </span>
                </div>
                {m.topCategories.length > 0 && (
                  <>
                    <div className="month-divider" />
                    <span className="month-sub-label">Top Expense Categories</span>
                    {m.topCategories.map(([cat, amt]) => (
                      <div key={cat} className="month-row">
                        <span className="month-detail-label">{cat}</span>
                        <span className="month-detail-value">
                          {formatCurrency(amt)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default MonthlyReport;
