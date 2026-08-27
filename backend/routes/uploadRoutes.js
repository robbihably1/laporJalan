const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Helper to get image storage path for local development
const getImageBaseDir = () => {
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

// Use memoryStorage on Vercel to avoid disk isolation across Lambda containers
const storageStrategy = process.env.VERCEL
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const targetDir = file.fieldname === 'avatar' || req.originalUrl.includes('profil')
          ? getProfilDir()
          : getLampiranDir();
        cb(null, targetDir);
      },
      filename: (req, file, cb) => {
        const prefix = file.fieldname === 'avatar' || req.originalUrl.includes('profil') ? 'profile-' : 'lampiran-';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, prefix + uniqueSuffix + ext);
      }
    });

const upload = multer({ storage: storageStrategy, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper to format response URL (Data URL for Vercel, Relative Path for Local)
const formatUploadResponse = (uploadedFile, folderName) => {
  if (process.env.VERCEL) {
    const mime = uploadedFile.mimetype || 'image/jpeg';
    const base64Str = uploadedFile.buffer
      ? uploadedFile.buffer.toString('base64')
      : fs.readFileSync(uploadedFile.path).toString('base64');
    return `data:${mime};base64,${base64Str}`;
  }
  return `/image/${folderName}/${uploadedFile.filename}`;
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
    const photoUrl = formatUploadResponse(uploadedFile, 'profil');
    return res.json({
      success: true,
      message: 'Foto profil berhasil diunggah!',
      url: photoUrl,
      filename: uploadedFile.filename || 'profile.jpg'
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
    const photoUrl = formatUploadResponse(uploadedFile, 'lampiran');
    return res.json({
      success: true,
      message: 'Lampiran foto berhasil diunggah!',
      url: photoUrl,
      filename: uploadedFile.filename || 'lampiran.jpg'
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
    const photoUrl = formatUploadResponse(uploadedFile, 'lampiran');
    return res.json({
      success: true,
      message: 'Foto berhasil diunggah!',
      url: photoUrl,
      filename: uploadedFile.filename || 'photo.jpg'
    });
  });
});

module.exports = router;

