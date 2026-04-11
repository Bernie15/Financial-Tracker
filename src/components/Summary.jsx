function Summary({ balance, income, expenses }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);

  return (
    <section className="summary">
      <div className="summary-card summary-balance">
        <span className="summary-label">Balance</span>
        <span className={`summary-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
          {formatCurrency(balance)}
        </span>
      </div>
      <div className="summary-card summary-income">
        <span className="summary-label">Income</span>
        <span className="summary-amount positive">{formatCurrency(income)}</span>
      </div>
      <div className="summary-card summary-expenses">
        <span className="summary-label">Expenses</span>
        <span className="summary-amount negative">{formatCurrency(expenses)}</span>
      </div>
    </section>
  );
}

export default Summary;
