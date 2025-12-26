const express = require('express');
const router = express.Router();
const dietPlanController = require('../controllers/dietPlanController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Routes
router.get('/:clientId/diet-plans/current', dietPlanController.getCurrentDietPlan);
router.get('/:clientId/diet-plans/versions', dietPlanController.getDietPlanVersions);
router.get('/:clientId/diet-plans/:dietPlanVersionId', dietPlanController.getDietPlanById);
router.post('/:clientId/diet-plans', dietPlanController.createDietPlan);

module.exports = router;
