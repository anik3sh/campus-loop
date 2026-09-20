import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { initDB, db } from './db';
import authRoutes from './routes/auth';
import listingsRoutes from './routes/listings';
import messagesRoutes from './routes/messages';
import usersRoutes from './routes/users';
import adminRoutes from './routes/admin';
import miscRoutes from './routes/misc';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev, configurable for production
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const uploadsStaticPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsStaticPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', miscRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    groq_model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  });
});

// 404 Handler for unmatched API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Endpoint '${req.originalUrl}' not found` });
});

// Centralized JSON error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Uploaded file is too large (maximum size is 10MB)' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Too many files uploaded' });
    }
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  if (err && err.message?.includes('Only image files')) {
    return res.status(400).json({ error: err.message });
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  if (statusCode >= 500) {
    console.error(`[Server Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({ error: message });
});

// Initialize database
initDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Campus Loop server running on http://localhost:${PORT}`);
  console.log(`📦 GROQ Model: ${process.env.GROQ_MODEL || 'qwen/qwen3.8-27b'}`);
  console.log(`🔑 GROQ API Key: ${process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('gsk_placeholder') ? '✅ Configured' : '⚠️  Not configured'}`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
      db.close();
      console.log('Database flushed and closed.');
    } catch (e: any) {
      console.error('Error closing database:', e.message);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
