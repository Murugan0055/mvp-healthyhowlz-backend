const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(requireRole(['trainer', 'gym_owner']));

router.post('/extract-plan', aiController.extractPlanFromImage);

module.exports = router;
