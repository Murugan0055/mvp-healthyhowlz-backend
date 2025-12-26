const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication and 'trainer' role
router.use(authMiddleware);
router.use(requireRole(['trainer', 'gym_owner'])); // Gym owners might also want to see clients

router.get('/clients', trainerController.getClients);
router.post('/clients', trainerController.addClient);
router.get('/clients/:clientId', trainerController.getClientDetails);
router.get('/clients/:clientId/meals', trainerController.getClientMeals);
router.get('/clients/:clientId/workouts', trainerController.getClientWorkouts);
router.post('/clients/:clientId/sessions/complete', trainerController.markSessionComplete);

module.exports = router;
