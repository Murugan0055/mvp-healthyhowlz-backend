const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const authMiddleware = require('../middleware/authMiddleware');

// All meal routes require authentication
router.post('/analyze', authMiddleware, mealController.analyzeMeal);
router.get('/', authMiddleware, mealController.getMeals);
router.get('/:id', authMiddleware, mealController.getMealById);
router.post('/', authMiddleware, mealController.createMeal);

module.exports = router;
