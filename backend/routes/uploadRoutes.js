const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer: simpan di memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // maks 10MB
});

/**
 * Konversi file buffer ke base64 data URI.
 * Format: data:<mimeType>;base64,<data>
 * String ini bisa disimpan langsung ke kolom avatar / photo_url di database.
 */
const toBase64DataUri = (file) => {
  const mimeType = file.mimetype || 'image/jpeg';
  const base64 = file.buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
};

// ──────────────────────────────────────────────
// POST /api/upload/profil — Upload foto profil
// ──────────────────────────────────────────────
router.post('/profil', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file foto profil: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto profil yang diunggah!' });
    }
    const dataUri = toBase64DataUri(uploadedFile);
    return res.json({
      success: true,
      message: 'Foto profil berhasil diunggah!',
      url: dataUri,
      filename: uploadedFile.originalname
    });
  });
});

// ──────────────────────────────────────────────
// POST /api/upload/lampiran — Upload foto laporan
// ──────────────────────────────────────────────
router.post('/lampiran', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file lampiran: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file lampiran yang diunggah!' });
    }
    const dataUri = toBase64DataUri(uploadedFile);
    return res.json({
      success: true,
      message: 'Lampiran foto berhasil diunggah!',
      url: dataUri,
      filename: uploadedFile.originalname
    });
  });
});

// ──────────────────────────────────────────────
// POST /api/upload — Default upload endpoint
// ──────────────────────────────────────────────
router.post('/', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah!' });
    }
    const dataUri = toBase64DataUri(uploadedFile);
    return res.json({
      success: true,
      message: 'Foto berhasil diunggah!',
      url: dataUri,
      filename: uploadedFile.originalname
    });
  });
});

module.exports = router;
