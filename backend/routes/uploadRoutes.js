const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper to get image storage path (inside project public/image directory or OS temp dir for Vercel)
const getImageBaseDir = () => {
  if (process.env.VERCEL) {
    const tmpDir = path.join(os.tmpdir(), 'image');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    return tmpDir;
  }
  const publicDir = path.resolve(__dirname, '../../public/image');
  if (fs.existsSync(publicDir)) return publicDir;
  const projectDir = path.resolve(__dirname, '../../image');
  if (fs.existsSync(projectDir)) return projectDir;
  const outerImageDir = path.resolve(__dirname, '../../../image');
  if (!fs.existsSync(outerImageDir)) {
    fs.mkdirSync(outerImageDir, { recursive: true });
  }
  return outerImageDir;
};

// Ensure subfolders exist
const getProfilDir = () => {
  const dir = path.join(getImageBaseDir(), 'profil');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const getLampiranDir = () => {
  const dir = path.join(getImageBaseDir(), 'lampiran');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

// Multer Storage Configuration for Profile Photos
const profilStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getProfilDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Multer Storage Configuration for Lampiran (Attachments)
const lampiranStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getLampiranDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'lampiran-' + uniqueSuffix + ext);
  }
});

const uploadProfil = multer({ storage: profilStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadLampiran = multer({ storage: lampiranStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// 1. Upload Profile Photo: POST /api/upload/profil
router.post('/profil', (req, res) => {
  uploadProfil.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file foto profil: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto profil yang diunggah!' });
    }
    const relativeUrl = `/image/profil/${uploadedFile.filename}`;
    return res.json({
      success: true,
      message: 'Foto profil berhasil diunggah!',
      url: relativeUrl,
      filename: uploadedFile.filename
    });
  });
});

// 2. Upload Lampiran Photo: POST /api/upload/lampiran
router.post('/lampiran', (req, res) => {
  uploadLampiran.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file lampiran: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file lampiran yang diunggah!' });
    }
    const relativeUrl = `/image/lampiran/${uploadedFile.filename}`;
    return res.json({
      success: true,
      message: 'Lampiran foto berhasil diunggah!',
      url: relativeUrl,
      filename: uploadedFile.filename
    });
  });
});

// 3. Default Upload Endpoint: POST /api/upload
router.post('/', (req, res) => {
  uploadLampiran.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah!' });
    }
    const relativeUrl = `/image/lampiran/${uploadedFile.filename}`;
    return res.json({
      success: true,
      message: 'Foto berhasil diunggah!',
      url: relativeUrl,
      filename: uploadedFile.filename
    });
  });
});

module.exports = router;

