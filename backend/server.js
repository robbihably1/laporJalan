const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { checkConnection } = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS & OPTIONS Preflight for frontend integration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

const fs = require('fs');

// Serve uploaded static image files (supports project public/image directory)
const getImageDir = () => {
  const publicDir = path.resolve(__dirname, '../public/image');
  if (fs.existsSync(publicDir)) return publicDir;
  const projectDir = path.resolve(__dirname, '../image');
  if (fs.existsSync(projectDir)) return projectDir;
  return path.resolve(__dirname, '../../image');
};

const outerImageDir = getImageDir();
app.use('/image', express.static(outerImageDir));
app.use('/uploads', express.static(path.join(outerImageDir, 'lampiran')));

// Express Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const adminRoutes = require('./routes/adminRoutes');
const regionRoutes = require('./routes/regionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/regions', regionRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'LaporJalan Node.js Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root Route
app.get('/', (req, res) => {
  res.send('LaporJalan API Server is running. Visit /api/health for system status.');
});

// Start Server
app.listen(PORT, async () => {
  console.log(`===================================================`);
  console.log(` LaporJalan Backend Server listening on port ${PORT}`);
  console.log(` Static Uploads URL: http://localhost:${PORT}/uploads/`);
  console.log(` API Health Check  : http://localhost:${PORT}/api/health`);
  console.log(`===================================================`);
  await checkConnection();
});
