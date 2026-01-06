const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication and 'trainer' role
router.use(authMiddleware);
router.use(requireRole(['trainer', 'gym_owner'])); // Gym owners might also want to see clients

router.get('/dashboard/stats', trainerController.getDashboardStats);
router.get('/clients', trainerController.getClients);
router.post('/clients', trainerController.addClient);
router.get('/clients/:clientId', trainerController.getClientDetails);
router.get('/clients/:clientId/meals', trainerController.getClientMeals);
router.get('/clients/:clientId/workouts', trainerController.getClientWorkouts);
router.get('/clients/:clientId/workouts/history', trainerController.getClientWorkoutsHistory);
router.post('/clients/:clientId/workouts/:id/complete', upload.single('machinePhoto'), trainerController.markClientWorkoutComplete);
router.post('/clients/:clientId/workouts/:id/incomplete', trainerController.markClientWorkoutIncomplete);

router.get('/sessions', trainerController.getSessions);
router.post('/sessions', trainerController.createSession);
router.patch('/sessions/:sessionId', trainerController.updateSession);
router.delete('/sessions/:sessionId', trainerController.deleteSession);

router.get('/clients/:clientId/progress', trainerController.getClientProgress);

router.post('/clients/:clientId/sessions/complete', trainerController.markSessionComplete);

module.exports = router;
