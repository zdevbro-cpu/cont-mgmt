import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// 라우트 import
import authRoutes from './routes/auth.route.js';
import contractsRoutes from './routes/contracts.route.js';
import paymentRoutes from './routes/payment.route.js';
import contractTypesRoutes from './routes/contract-types.route.js';
import usersRoutes from './routes/users.route.js';
import contractTemplatesRouter from './routes/contract-templates.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from client .env.production
dotenv.config({ path: path.join(__dirname, '../client/.env.production') });

console.log('Current working directory:', process.cwd());
console.log('Supabase URL set:', !!process.env.SUPABASE_URL);
console.log('Supabase Key set:', !!process.env.SUPABASE_SERVICE_KEY);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('CRITICAL: Supabase credentials missing!');
}

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // 정적 파일 접근 허용
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ].filter(Boolean);

    if (!origin || allowedOrigins.indexOf(origin) !== -1 || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 파일)
// server/uploads 디렉토리를 /uploads 경로로 서빙
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
      payments: '/api/payments',
      contractTypes: '/api/contract-types',
      users: '/api/users'
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
app.use('/api/payments', paymentRoutes);
app.use('/api/contract-types', contractTypesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/contract-templates', contractTemplatesRouter);

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