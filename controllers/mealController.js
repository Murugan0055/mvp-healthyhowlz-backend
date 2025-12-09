const { pool, model } = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.analyzeMeal = async (req, res) => {
  try {
    const { image } = req.body; // Expecting base64 string
    if (!image) return res.status(400).json({ error: 'Image required' });

    // Remove data:image/jpeg;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    // Use Gemini Pro Vision for image analysis
    const generativeModel = genAI.getGenerativeModel({ model: model });

    const prompt = `Analyze this food image.
    1. Identify the meal type (Breakfast, Lunch, Dinner, Snack).
    2. Identify specific food items (e.g., 'Hariyali Chicken', 'Paneer Butter Masala').
    3. Estimate the quantity for EACH item (e.g., '100g', '1 cup', '2 pieces').
    4. Calculate total calories and macros (protein, carbs, fat) based on these quantities.

    IMPORTANT: The 'foods_detected' array MUST contain strings in the format "Food Name (Quantity)".
    Example: ["Steamed Rice (150g)", "Dal Tadka (1 bowl)", "Chicken Curry (200g)"]

    Return ONLY a JSON object:
    {
      "meal_type": "string",
      "foods_detected": ["string"], 
      "calories_est": number,
      "macros": { "protein": number, "carbs": number, "fat": number }
    }`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    const result = await generativeModel.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log('text', text);
    // Clean up markdown code blocks if present to ensure valid JSON
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(jsonStr);
    console.log('data', data);

    res.json(data);
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'Failed to analyze meal' });
  }
};

exports.getMeals = async (req, res) => {
  try {
    // Get user_id from authenticated middleware
    const userId = req.user.id;

    // Extract query parameters for filtering
    const {
      from_date,      // Filter: from date (YYYY-MM-DD)
      to_date,        // Filter: to date (YYYY-MM-DD)
      meal_type,      // Filter: specific meal type
      sort_by,        // Sort field: created_at, date, calories_est, protein, carbs, fat
      sort_order,     // Sort order: ASC or DESC (default DESC)
      limit,          // Limit number of results
      offset          // Offset for pagination
    } = req.query;

    // Build query dynamically
    let query = 'SELECT * FROM meal_logs WHERE user_id = $1';
    const queryParams = [userId];
    let paramIndex = 2;

    // Add date range filter
    if (from_date) {
      query += ` AND date >= $${paramIndex}`;
      queryParams.push(from_date);
      paramIndex++;
    }

    if (to_date) {
      query += ` AND date <= $${paramIndex}`;
      queryParams.push(to_date);
      paramIndex++;
    }

    // Add meal type filter
    if (meal_type) {
      query += ` AND meal_type = $${paramIndex}`;
      queryParams.push(meal_type);
      paramIndex++;
    }

    // Add sorting
    const validSortFields = ['created_at', 'date', 'calories_est', 'protein', 'carbs', 'fat', 'time'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortField} ${sortDirection}`;

    // Add pagination
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      queryParams.push(parseInt(limit));
      paramIndex++;
    }

    if (offset) {
      query += ` OFFSET $${paramIndex}`;
      queryParams.push(parseInt(offset));
    }

    const result = await pool.query(query, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('Get meals error:', err);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
};

exports.createMeal = async (req, res) => {
  try {
    // Get user_id from authenticated middleware (not from request body)
    const userId = req.user.id;

    const { date, time, meal_type, foods_detected, calories_est, protein, carbs, fat, notes, image_url } = req.body;

    // Basic validation
    if (!meal_type || !calories_est) {
      return res.status(400).json({ error: 'Meal type and calories are required' });
    }

    const result = await pool.query(
      `INSERT INTO meal_logs 
      (user_id, date, time, meal_type, foods_detected, calories_est, protein, carbs, fat, notes, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [userId, date, time, meal_type, foods_detected, calories_est, protein, carbs, fat, notes, image_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create meal error:', err);
    res.status(500).json({ error: 'Failed to save meal' });
  }
};

exports.getMealById = async (req, res) => {
  try {
    // Get user_id from authenticated middleware
    const userId = req.user.id;
    const { id } = req.params;

    // Fetch the meal and ensure it belongs to the authenticated user
    const result = await pool.query(
      'SELECT * FROM meal_logs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get meal by ID error:', err);
    res.status(500).json({ error: 'Failed to fetch meal details' });
  }
};
