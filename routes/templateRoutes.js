const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(requireRole(['trainer', 'gym_owner']));

// Diet Templates
router.get('/diet', templateController.getDietTemplates);
router.post('/diet', templateController.createDietTemplate);
router.put('/diet/:id', templateController.updateDietTemplate);
router.get('/diet/:id', templateController.getDietTemplateById);
router.delete('/diet/:id', templateController.deleteDietTemplate);

// Workout Templates
router.get('/workout', templateController.getWorkoutTemplates);
router.post('/workout', templateController.createWorkoutTemplate);
router.put('/workout/:id', templateController.updateWorkoutTemplate);
router.get('/workout/:id', templateController.getWorkoutTemplateById);
router.delete('/workout/:id', templateController.deleteWorkoutTemplate);

module.exports = router;
