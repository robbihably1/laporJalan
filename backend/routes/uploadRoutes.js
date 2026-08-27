const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { pool } = require('../config/db');

// Multer: simpan di memory, bukan disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // maks 10MB
});

/**
 * Simpan file ke tabel `images` di database, return ID & URL relatif.
 * URL format: /api/upload/image/<id>
 */
const saveFileToDB = async (file, folderName) => {
  const base64Data = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';
  const ext = path.extname(file.originalname) || '.jpg';
  const prefix = folderName === 'profil' ? 'profile-' : 'lampiran-';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const filename = prefix + uniqueSuffix + ext;

  const [result] = await pool.query(
    `INSERT INTO images (filename, folder, mime_type, data) VALUES (?, ?, ?, ?)`,
    [filename, folderName, mimeType, base64Data]
  );

  const imageId = result.insertId;
  const relativeUrl = `/api/upload/image/${imageId}`;
  return { relativeUrl, filename, imageId };
};

// ──────────────────────────────────────────────
// GET /api/upload/image/:id — Serve gambar dari DB
// ──────────────────────────────────────────────
router.get('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT mime_type, data FROM images WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gambar tidak ditemukan' });
    }
    const { mime_type, data } = rows[0];
    const buffer = Buffer.from(data, 'base64');
    res.setHeader('Content-Type', mime_type || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (err) {
    console.error('Gagal mengambil gambar dari DB:', err.message);
    return res.status(500).json({ success: false, message: 'Gagal mengambil gambar' });
  }
});

// ──────────────────────────────────────────────
// POST /api/upload/profil — Upload foto profil
// ──────────────────────────────────────────────
router.post('/profil', (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file foto profil: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto profil yang diunggah!' });
    }
    try {
      const { relativeUrl, filename } = await saveFileToDB(uploadedFile, 'profil');
      return res.json({
        success: true,
        message: 'Foto profil berhasil diunggah!',
        url: relativeUrl,
        filename
      });
    } catch (dbErr) {
      console.error('Gagal simpan profil ke DB:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan foto profil ke database: ' + dbErr.message });
    }
  });
});

// ──────────────────────────────────────────────
// POST /api/upload/lampiran — Upload foto laporan
// ──────────────────────────────────────────────
router.post('/lampiran', (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file lampiran: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file lampiran yang diunggah!' });
    }
    try {
      const { relativeUrl, filename } = await saveFileToDB(uploadedFile, 'lampiran');
      return res.json({
        success: true,
        message: 'Lampiran foto berhasil diunggah!',
        url: relativeUrl,
        filename
      });
    } catch (dbErr) {
      console.error('Gagal simpan lampiran ke DB:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan lampiran ke database: ' + dbErr.message });
    }
  });
});

// ──────────────────────────────────────────────
// POST /api/upload — Default upload endpoint
// ──────────────────────────────────────────────
router.post('/', (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah!' });
    }
    try {
      const { relativeUrl, filename } = await saveFileToDB(uploadedFile, 'lampiran');
      return res.json({
        success: true,
        message: 'Foto berhasil diunggah!',
        url: relativeUrl,
        filename
      });
    } catch (dbErr) {
      console.error('Gagal simpan foto ke DB:', dbErr.message);
      return res.status(500).json({ success: false, message: 'Gagal menyimpan foto ke database: ' + dbErr.message });
    }
  });
});

module.exports = router;
