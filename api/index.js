const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import Backend Routes
const authRoutes = require('../backend/routes/authRoutes');
const reportRoutes = require('../backend/routes/reportRoutes');
const uploadRoutes = require('../backend/routes/uploadRoutes');
const adminRoutes = require('../backend/routes/adminRoutes');
const regionRoutes = require('../backend/routes/regionRoutes');

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

module.exports = app;
