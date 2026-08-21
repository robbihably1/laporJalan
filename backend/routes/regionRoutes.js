const express = require('express');
const router = express.Router();
const regionController = require('../controllers/regionController');

router.get('/provinces', regionController.getProvinces);
router.get('/regencies', regionController.getRegencies);
router.get('/districts', regionController.getDistricts);
router.get('/villages', regionController.getVillages);

module.exports = router;
