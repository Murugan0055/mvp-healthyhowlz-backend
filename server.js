const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use('/uploads', express.static('uploads'));

const { pool } = require('./db');
const authRoutes = require('./routes/authRoutes');

// ... (imports remain)

// Database Connection is now handled in ./db/index.js but we import pool here if needed for other routes
// or we can refactor other routes later. For now, we keep the pool usage in other routes but use the imported pool.

// Routes
app.get('/', (req, res) => {
  res.send('Healthyhowlz Tracker API Running');
});

// Auth Routes
app.use('/api/auth', authRoutes);


const mealRoutes = require('./routes/mealRoutes');

// ...

// Auth Routes
app.use('/api/auth', authRoutes);

// Meal Routes
app.use('/api/meals', mealRoutes);

const dietPlanRoutes = require('./routes/dietPlanRoutes');
app.use('/api/clients', dietPlanRoutes);



// Workout Routes
const workoutPlanRoutes = require('./routes/workoutPlanRoutes');
const workoutSessionRoutes = require('./routes/workoutSessionRoutes');

app.use('/api/clients', workoutPlanRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);

// Legacy Workout Routes (Manual Logging)

app.get('/api/workouts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workout_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.post('/api/workouts', async (req, res) => {
  const { user_id, date, title, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO workout_logs (user_id, date, title, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id, date, title, notes]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Save failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
