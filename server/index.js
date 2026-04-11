import express from 'express';
import cors from 'cors';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import tripsRouter from './routes/trips.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/trips', tripsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
