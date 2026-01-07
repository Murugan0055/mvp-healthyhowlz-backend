const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { checkAiLimit } = require('../middleware/aiLimitMiddleware');

router.use(authMiddleware);
router.use(requireRole(['trainer', 'gym_owner']));

router.post('/extract-plan', checkAiLimit, aiController.extractPlanFromImage);

module.exports = router;
