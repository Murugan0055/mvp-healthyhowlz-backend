const { pool } = require('../db');

// GET /me/profile - Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, email, name, age, phone, gender, profile_image_url, 
              dob, activity_level, goal, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// PUT /me/profile - Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, age, phone, email, gender, profile_image_url, dob, activity_level, goal } = req.body;

    // Basic validation
    if (email && !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (age && (age < 1 || age > 120)) {
      return res.status(400).json({ error: 'Invalid age' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramIndex++}`);
      values.push(age);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(gender);
    }
    if (profile_image_url !== undefined) {
      updates.push(`profile_image_url = $${paramIndex++}`);
      values.push(profile_image_url);
    }
    if (dob !== undefined) {
      updates.push(`dob = $${paramIndex++}`);
      values.push(dob);
    }
    if (activity_level !== undefined) {
      updates.push(`activity_level = $${paramIndex++}`);
      values.push(activity_level);
    }
    if (goal !== undefined) {
      updates.push(`goal = $${paramIndex++}`);
      values.push(goal);
    }

    // Always update updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, name, age, phone, gender, profile_image_url, 
                dob, activity_level, goal, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// GET /me/body-metrics - Get user's body metrics history
exports.getBodyMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM user_body_metrics 
       WHERE user_id = $1 
       ORDER BY recorded_at DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get body metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch body metrics' });
  }
};

// POST /me/body-metrics - Create new body metrics entry
exports.createBodyMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recorded_at, height_cm, weight_kg, bmi, bmr, body_fat_percent, notes, image_url } = req.body;

    // Validation
    if (!recorded_at) {
      return res.status(400).json({ error: 'recorded_at is required' });
    }

    const result = await pool.query(
      `INSERT INTO user_body_metrics 
       (user_id, recorded_at, height_cm, weight_kg, bmi, bmr, body_fat_percent, notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, recorded_at, height_cm, weight_kg, bmi, bmr, body_fat_percent, notes, image_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create body metrics error:', err);
    res.status(500).json({ error: 'Failed to save body metrics' });
  }
};

// GET /me/body-measurements - Get user's body measurements history
exports.getBodyMeasurements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM user_body_measurements 
       WHERE user_id = $1 
       ORDER BY recorded_at DESC, created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get body measurements error:', err);
    res.status(500).json({ error: 'Failed to fetch body measurements' });
  }
};

// POST /me/body-measurements - Create new body measurements entry
exports.createBodyMeasurements = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recorded_at, arm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, shoulders_cm, notes, image_url } = req.body;

    // Validation
    if (!recorded_at) {
      return res.status(400).json({ error: 'recorded_at is required' });
    }

    const result = await pool.query(
      `INSERT INTO user_body_measurements 
       (user_id, recorded_at, arm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, shoulders_cm, notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, recorded_at, arm_cm, chest_cm, waist_cm, hip_cm, thigh_cm, calf_cm, shoulders_cm, notes, image_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create body measurements error:', err);
    res.status(500).json({ error: 'Failed to save body measurements' });
  }
};

// GET /me/body-metrics/latest - Get latest body metrics
exports.getLatestBodyMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM user_body_metrics 
       WHERE user_id = $1 
       ORDER BY recorded_at DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get latest body metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch latest body metrics' });
  }
};

// GET /me/body-measurements/latest - Get latest body measurements
exports.getLatestBodyMeasurements = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM user_body_measurements 
       WHERE user_id = $1 
       ORDER BY recorded_at DESC, created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get latest body measurements error:', err);
    res.status(500).json({ error: 'Failed to fetch latest body measurements' });
  }
};
