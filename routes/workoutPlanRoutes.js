const express = require('express');
const router = express.Router();
const workoutPlanController = require('../controllers/workoutPlanController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protect all routes
router.use(authMiddleware);

// Routes
router.get('/:clientId/workout-plans/current', workoutPlanController.getCurrentWorkoutPlan);
router.get('/:clientId/workout-plans/versions', workoutPlanController.getWorkoutPlanVersions);
router.get('/:clientId/workout-plans/:workoutPlanVersionId', workoutPlanController.getWorkoutPlanById);

module.exports = router;
