const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Routes for Admin User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
