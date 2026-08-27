const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Initialize global image memory cache
if (!global.IMAGE_CACHE) {
  global.IMAGE_CACHE = new Map();
}
//test committ

// Helper to get image storage path for local development & Vercel
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to save file & return clean relative URL (/image/profil/profile-xxx.jpg)
const saveUploadedFile = (uploadedFile, folderName) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(uploadedFile.originalname) || '.jpg';
  const prefix = folderName === 'profil' ? 'profile-' : 'lampiran-';
  const filename = prefix + uniqueSuffix + ext;

  const targetDir = folderName === 'profil' ? getProfilDir() : getLampiranDir();
  const filePath = path.join(targetDir, filename);

  try {
    fs.writeFileSync(filePath, uploadedFile.buffer);
  } catch (e) {
    console.warn("Write file notice:", e.message);
  }

  const relativeUrl = `/image/${folderName}/${filename}`;
  if (global.IMAGE_CACHE) {
    global.IMAGE_CACHE.set(relativeUrl, {
      buffer: uploadedFile.buffer,
      mimeType: uploadedFile.mimetype || 'image/jpeg'
    });
  }

  return { relativeUrl, filename };
};

// 1. Upload Profile Photo: POST /api/upload/profil
router.post('/profil', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file foto profil: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto profil yang diunggah!' });
    }
    const { relativeUrl, filename } = saveUploadedFile(uploadedFile, 'profil');
    return res.json({
      success: true,
      message: 'Foto profil berhasil diunggah!',
      url: relativeUrl,
      filename
    });
  });
});

// 2. Upload Lampiran Photo: POST /api/upload/lampiran
router.post('/lampiran', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file lampiran: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file lampiran yang diunggah!' });
    }
    const { relativeUrl, filename } = saveUploadedFile(uploadedFile, 'lampiran');
    return res.json({
      success: true,
      message: 'Lampiran foto berhasil diunggah!',
      url: relativeUrl,
      filename
    });
  });
});

// 3. Default Upload Endpoint: POST /api/upload
router.post('/', (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: 'Gagal memproses file: ' + err.message });
    }
    const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ success: false, message: 'Tidak ada file foto yang diunggah!' });
    }
    const { relativeUrl, filename } = saveUploadedFile(uploadedFile, 'lampiran');
    return res.json({
      success: true,
      message: 'Foto berhasil diunggah!',
      url: relativeUrl,
      filename
    });
  });
});

module.exports = router;

