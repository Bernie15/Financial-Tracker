import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#2d2d2d', '#6b7280', '#3d9970', '#e05a47', '#d4a853',
  '#7c6fc4', '#4a9ec4', '#c47a6f', '#8fbc5a', '#b07d4f',
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(amount);

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <span className="chart-tooltip-name">{name}</span>
        <span className="chart-tooltip-value">
          {formatCurrency(value)} · {(percent * 100).toFixed(1)}%
        </span>
      </div>
    );
  }
  return null;
}

function CategoryChart({ transactions, type }) {
  const filtered = transactions.filter((t) => t.type === type);

  const categoryMap = {};
  filtered.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const total = Object.values(categoryMap).reduce((s, v) => s + v, 0);
  const data = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value, percent: total > 0 ? value / total : 0 }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <div className="chart-section">
        <h2 className="section-title">
          {type === 'expense' ? 'Expenses' : 'Income'} by Category
        </h2>
        <p className="empty-state">No {type} data yet</p>
      </div>
    );
  }

  return (
    <div className="chart-section">
      <h2 className="section-title">
        {type === 'expense' ? 'Expenses' : 'Income'} by Category
      </h2>
      <div className="chart-container">
        <div className="chart-pie">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="chart-legend">
          {data.map((entry, i) => (
            <li key={entry.name} className="legend-item">
              <span
                className="legend-dot"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="legend-name">{entry.name}</span>
              <span className="legend-value">{formatCurrency(entry.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CategoryChart;
