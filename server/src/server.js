import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 라우트 import
import authRoutes from './routes/auth.route.js';
import contractsRoutes from './routes/contract.route.js';
import paymentRoutes from './routes/payment.route.js'; // ← 추가

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase 클라이언트를 req에 추가
app.use((req, res, next) => {
  req.supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Contract Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      contracts: '/api/contracts',
      payments: '/api/payments' // ← 추가
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/payments', paymentRoutes); // ← 추가
// app.use('/api/schedule', scheduleRoutes);  // 필요시 추가
// app.use('/api/admin', adminRoutes);        // 필요시 추가

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});