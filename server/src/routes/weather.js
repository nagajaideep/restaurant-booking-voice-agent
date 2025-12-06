const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');

// GET /api/weather?date=YYYY-MM-DD&location=CityName
router.get('/', weatherController.getWeather);

module.exports = router;
