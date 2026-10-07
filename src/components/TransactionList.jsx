function TransactionList({ transactions, onDelete, loading }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <section className="list-section">
      <h2 className="section-title">History</h2>
      {loading ? (
        <p className="empty-state">Loading transactions...</p>
      ) : transactions.length === 0 ? (
        <p className="empty-state">No transactions yet</p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((t) => (
            <li key={t.id} className={`transaction-item ${t.type}`}>
              <div className="transaction-info">
                <span className="transaction-desc">{t.description}</span>
                <span className="transaction-meta">
                  {t.category} · {formatDate(t.date)}
                </span>
              </div>
              <div className="transaction-right">
                <span className={`transaction-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '−'}
                  {formatCurrency(t.amount)}
                </span>
                <button
                  className="delete-btn"
                  onClick={() => onDelete(t.id)}
                  aria-label={`Delete ${t.description}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default TransactionList;
