import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import invoiceRoutes from './routes/invoice.routes';
import paymentRoutes from './routes/payment.routes';
import reportRoutes from './routes/report.routes';
import profileRoutes from './routes/profile.routes';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/profile', profileRoutes);

app.use(errorMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
