import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from '../backend/routes/authRoutes.js';
import reportRoutes from '../backend/routes/reportRoutes.js';
import uploadRoutes from '../backend/routes/uploadRoutes.js';
import adminRoutes from '../backend/routes/adminRoutes.js';
import regionRoutes from '../backend/routes/regionRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static Image serving (outer image directory)
const outerImageDir = path.resolve(__dirname, '../../image');
app.use('/image', express.static(outerImageDir));
app.use('/uploads', express.static(path.join(outerImageDir, 'lampiran')));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Mount routes both with /api prefix and without for Vercel serverless compatibility
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/reports', reportRoutes);
app.use('/reports', reportRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

app.use('/api/regions', regionRoutes);
app.use('/regions', regionRoutes);

// Health Check
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'OK',
    service: 'LaporJalan Serverless Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint ${req.method} ${req.url} tidak ditemukan`
  });
});

// Global Express Error Handler for Serverless
app.use((err, req, res, next) => {
  console.error("Serverless API Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server backend'
  });
});

export default app;
