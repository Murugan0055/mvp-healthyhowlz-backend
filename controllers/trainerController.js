const { pool } = require('../db');
const bcrypt = require('bcryptjs');

// GET /trainer/clients - List all clients for the logged-in trainer
exports.getClients = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { sort = 'recent', filter = 'active', search } = req.query;

    let query = `
      SELECT id, name, email, phone, profile_image_url, 
             total_sessions, completed_sessions, validity_expires_at, created_at,
             CASE 
               WHEN (total_sessions - completed_sessions) > 0 AND (validity_expires_at IS NULL OR validity_expires_at > NOW()) THEN 'Active'
               ELSE 'Inactive'
             END as status
      FROM users 
      WHERE trainer_id = $1 AND role = 'client'
    `;

    const values = [trainerId];
    let paramIndex = 2;

    // Search
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      values.push(`%${search}%`);
      paramIndex++;
    }

    // Filtering
    if (filter === 'active') {
      query += ` AND (total_sessions - completed_sessions) > 0 AND (validity_expires_at IS NULL OR validity_expires_at > NOW())`;
    } else if (filter === 'inactive') {
      query += ` AND ((total_sessions - completed_sessions) <= 0 OR validity_expires_at <= NOW())`;
    }
    // If filter is 'all', we don't add a WHERE clause for status

    // Sorting
    if (sort === 'recent') {
      query += ` ORDER BY created_at DESC`;
    } else if (sort === 'active') {
      // Sort by status (Active first) then name
      query += ` ORDER BY status ASC, name ASC`;
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
};

// POST /trainer/clients - Add a new client
exports.addClient = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const { name, email, phone, age, gender, goal, sessions, validity, password, profile_image_url } = req.body;

    // Basic validation
    if (!email || !name) {
      return res.status(400).json({ error: 'Name and Email are required' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password (default or provided)
    const pwd = password || 'Welcome123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pwd, salt);

    // Calculate validity date
    let validityDate = null;
    if (validity) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(validity));
      validityDate = date.toISOString();
    }

    // Sanitize inputs
    const ageVal = age && !isNaN(age) ? parseInt(age) : null;
    const sessionsVal = sessions && !isNaN(sessions) ? parseInt(sessions) : 0;

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (
        email, password, name, phone, age, gender, goal, 
        role, trainer_id, total_sessions, completed_sessions, validity_expires_at, profile_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'client', $8, $9, 0, $10, $11) 
      RETURNING id, name, email, role, created_at`,
      [email, hashedPassword, name, phone, ageVal, gender, goal, trainerId, sessionsVal, validityDate, profile_image_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Add client error:', err);
    res.status(500).json({ error: 'Failed to add client: ' + err.message });
  }
};

// GET /trainer/clients/:clientId - Get specific client details
exports.getClientDetails = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    // Fetch Profile
    const profileResult = await pool.query(
      `SELECT id, email, name, age, phone, gender, profile_image_url, 
              dob, activity_level, goal, total_sessions, completed_sessions, validity_expires_at,
              created_at 
       FROM users WHERE id = $1`,
      [clientId]
    );

    res.json(profileResult.rows[0]);
  } catch (err) {
    console.error('Get client details error:', err);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
};

// GET /trainer/clients/:clientId/meals
exports.getClientMeals = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;
    const { from_date, to_date } = req.query;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    let query = 'SELECT * FROM meal_logs WHERE user_id = $1';
    const queryParams = [clientId];
    let paramIndex = 2;

    if (from_date) {
      query += ` AND date >= $${paramIndex++}`;
      queryParams.push(from_date);
    }
    if (to_date) {
      query += ` AND date <= $${paramIndex++}`;
      queryParams.push(to_date);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Get client meals error:', err);
    res.status(500).json({ error: 'Failed to fetch client meals' });
  }
};

// GET /trainer/clients/:clientId/workouts
exports.getClientWorkouts = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;
    const { date } = req.query;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // 1. Find the plan active on this date
    const planResult = await pool.query(
      `SELECT id FROM workout_plan_versions
       WHERE client_id = $1
       AND followed_from <= $2
       AND (followed_till IS NULL OR followed_till >= $2)
       LIMIT 1`,
      [clientId, date]
    );

    if (planResult.rows.length === 0) {
      return res.json([]); // No plan assigned for this date
    }

    const planId = planResult.rows[0].id;

    // 2. Fetch exercises and join with completions
    const exercisesResult = await pool.query(
      `SELECT 
         e.*,
         CASE WHEN wc.id IS NOT NULL THEN true ELSE false END as is_completed,
         wc.id as completion_id
       FROM workout_plan_exercises e
       LEFT JOIN workout_completions wc 
         ON e.id = wc.workout_plan_exercise_id 
         AND wc.user_id = $1 
         AND wc.date = $2
       WHERE e.workout_plan_version_id = $3
       AND e.day_name = trim(to_char($2::date, 'Day'))
       ORDER BY e.order_index ASC`,
      [clientId, date, planId]
    );

    res.json(exercisesResult.rows);
  } catch (err) {
    console.error('Get client workouts error:', err);
    res.status(500).json({ error: 'Failed to fetch client workouts' });
  }
};

// POST /trainer/clients/:clientId/sessions/complete
exports.markSessionComplete = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id, total_sessions, completed_sessions FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    const client = clientCheck.rows[0];

    if (client.completed_sessions >= client.total_sessions) {
      return res.status(400).json({ error: 'All sessions completed' });
    }

    // Increment completed_sessions
    await pool.query(
      'UPDATE users SET completed_sessions = completed_sessions + 1 WHERE id = $1',
      [clientId]
    );

    res.json({ message: 'Session marked as complete', completed_sessions: client.completed_sessions + 1, total_sessions: client.total_sessions });
  } catch (err) {
    console.error('Mark session complete error:', err);
    res.status(500).json({ error: 'Failed to mark session complete' });
  }
};
// GET /trainer/clients/:clientId/workouts/history
exports.getClientWorkoutsHistory = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({ error: 'Date range required' });
    }

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    const query = `
      WITH dates AS (
        SELECT generate_series($2::date, $3::date, '1 day'::interval)::date AS date
      )
      SELECT 
        d.date,
        e.id, e.workout_plan_version_id, e.day_name, e.name, e.sets, e.reps, e.duration, e.notes, e.order_index,
        CASE WHEN wc.id IS NOT NULL THEN true ELSE false END as is_completed,
        wc.id as completion_id
      FROM dates d
      JOIN workout_plan_versions wpv ON wpv.client_id = $1 
        AND wpv.followed_from <= d.date 
        AND (wpv.followed_till IS NULL OR wpv.followed_till >= d.date)
      JOIN workout_plan_exercises e ON e.workout_plan_version_id = wpv.id
        AND e.day_name = trim(to_char(d.date, 'Day'))
      LEFT JOIN workout_completions wc ON wc.workout_plan_exercise_id = e.id
        AND wc.user_id = $1
        AND wc.date = d.date
      ORDER BY d.date DESC, e.order_index ASC
    `;

    const result = await pool.query(query, [clientId, from_date, to_date]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get client workouts history error:', err);
    res.status(500).json({ error: 'Failed to fetch client workouts history' });
  }
};

// POST /trainer/clients/:clientId/workouts/:id/complete
exports.markClientWorkoutComplete = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;
    const { id } = req.params; // exercise id
    const { date } = req.body;
    const file = req.file;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    const exerciseRes = await pool.query(
      'SELECT category FROM workout_plan_exercises WHERE id = $1',
      [id]
    );

    if (exerciseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const { category } = exerciseRes.rows[0];
    let photoUrl = null;
    if (category === 'CARDIO' && file) {
      photoUrl = `/uploads/${file.filename}`;
    }

    await pool.query(
      `INSERT INTO workout_completions (user_id, workout_plan_exercise_id, date, machine_photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, workout_plan_exercise_id, date) 
       DO UPDATE SET machine_photo_url = EXCLUDED.machine_photo_url, completed_at = CURRENT_TIMESTAMP`,
      [clientId, id, date, photoUrl]
    );

    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Mark client workout complete error:', err);
    res.status(500).json({ error: 'Failed to mark client workout complete' });
  }
};

// POST /trainer/clients/:clientId/workouts/:id/incomplete
exports.markClientWorkoutIncomplete = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const clientId = req.params.clientId;
    const { id } = req.params; // exercise id
    const { date } = req.body;

    // Verify client belongs to trainer
    const clientCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND trainer_id = $2',
      [clientId, trainerId]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found or not authorized' });
    }

    await pool.query(
      `DELETE FROM workout_completions
       WHERE user_id = $1 AND workout_plan_exercise_id = $2 AND date = $3`,
      [clientId, id, date]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Mark client workout incomplete error:', err);
    res.status(500).json({ error: 'Failed to mark client workout incomplete' });
  }
};
