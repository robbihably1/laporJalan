const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Routes for Reports API
router.get('/', reportController.getAllReports);
router.get('/:id', reportController.getReportById);
router.post('/', reportController.createReport);
router.put('/:id', reportController.updateReportDetails);
router.patch('/:id/status', reportController.updateReportStatus);

module.exports = router;
