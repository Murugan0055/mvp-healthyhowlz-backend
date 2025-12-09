const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

// All routes require authentication
router.use(authMiddleware);

// Profile routes
router.get('/profile', profileController.getProfile);
router.put('/profile', profileController.updateProfile);

// Body metrics routes
router.get('/body-metrics', profileController.getBodyMetrics);
router.post('/body-metrics', profileController.createBodyMetrics);
router.get('/body-metrics/latest', profileController.getLatestBodyMetrics);

// Body measurements routes
router.get('/body-measurements', profileController.getBodyMeasurements);
router.post('/body-measurements', profileController.createBodyMeasurements);
router.get('/body-measurements/latest', profileController.getLatestBodyMeasurements);

module.exports = router;
