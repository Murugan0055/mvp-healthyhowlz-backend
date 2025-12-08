const express = require('express');
const router = express.Router();
const workoutSessionController = require('../controllers/workoutSessionController');
const authMiddleware = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.get('/', workoutSessionController.getWorkoutSessions);
router.post('/:id/complete', upload.single('machinePhoto'), workoutSessionController.markComplete);
router.post('/:id/incomplete', workoutSessionController.markIncomplete);

module.exports = router;
