import express from 'express';
import cors from 'cors';
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import tripsRouter from './routes/trips.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    message: 'Financial Tracker API is running.',
    endpoints: ['/api/transactions', '/api/categories', '/api/trips'],
  });
});

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/trips', tripsRouter);

export default app;
