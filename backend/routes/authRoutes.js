const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Routes for User Auth & Verification
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);

// Email Verification & Status Check Endpoints
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-email', authController.verifyEmail);
router.get('/check-verification', authController.checkVerificationStatus);

// Forgot Password & Reset Password Endpoints
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
