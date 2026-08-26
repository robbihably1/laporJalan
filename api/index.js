const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { checkConnection } = require('../backend/config/db');

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

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/regions', regionRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'LaporJalan Serverless Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = app;
