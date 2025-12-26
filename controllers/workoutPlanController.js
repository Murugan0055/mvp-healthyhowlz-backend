const { pool } = require('../db');

// Get current active workout plan for a client
const getCurrentWorkoutPlan = async (req, res) => {
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    // 1. Get the active version
    const versionResult = await pool.query(
      `SELECT * FROM workout_plan_versions
       WHERE client_id = $1 AND followed_till IS NULL
       LIMIT 1`,
      [clientId]
    );

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ message: 'No active workout plan found' });
    }

    const version = versionResult.rows[0];

    // 2. Get exercises for this version
    const exercisesResult = await pool.query(
      `SELECT * FROM workout_plan_exercises
       WHERE workout_plan_version_id = $1
       ORDER BY order_index ASC`,
      [version.id]
    );

    const plan = {
      ...version,
      exercises: exercisesResult.rows
    };

    res.json(plan);
  } catch (err) {
    console.error('Error fetching current workout plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all workout plan versions for a client
const getWorkoutPlanVersions = async (req, res) => {
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    const result = await pool.query(
      `SELECT id, title, followed_from, followed_till,
              (followed_till IS NULL) as is_current
       FROM workout_plan_versions
       WHERE client_id = $1
       ORDER BY followed_from DESC`,
      [clientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching workout plan versions:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a specific workout plan version
const getWorkoutPlanById = async (req, res) => {
  const { workoutPlanVersionId } = req.params;
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    // 1. Get the version (verify ownership)
    const versionResult = await pool.query(
      `SELECT * FROM workout_plan_versions
       WHERE id = $1 AND client_id = $2`,
      [workoutPlanVersionId, clientId]
    );

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Workout plan version not found' });
    }

    const version = versionResult.rows[0];

    // 2. Get exercises
    const exercisesResult = await pool.query(
      `SELECT * FROM workout_plan_exercises
       WHERE workout_plan_version_id = $1
       ORDER BY order_index ASC`,
      [version.id]
    );

    const plan = {
      ...version,
      exercises: exercisesResult.rows
    };

    res.json(plan);
  } catch (err) {
    console.error('Error fetching workout plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new workout plan version
const createWorkoutPlan = async (req, res) => {
  const { clientId } = req.params;
  const { title, description, exercises, isActive } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. If isActive is true, deactivate current active plan
    if (isActive) {
      await client.query(
        `UPDATE workout_plan_versions 
         SET followed_till = CURRENT_DATE, updated_at = NOW()
         WHERE client_id = $1 AND followed_till IS NULL`,
        [clientId]
      );
    }

    // 2. Create new version
    const followedFrom = new Date().toISOString().split('T')[0];
    const followedTill = isActive ? null : followedFrom;

    const versionResult = await client.query(
      `INSERT INTO workout_plan_versions (client_id, created_by_trainer_id, title, description, followed_from, followed_till)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clientId, trainerId, title, description, followedFrom, followedTill]
    );

    const newVersion = versionResult.rows[0];

    // 3. Insert exercises
    if (exercises && exercises.length > 0) {
      const exerciseQueries = exercises.map((ex, index) => {
        return client.query(
          `INSERT INTO workout_plan_exercises (workout_plan_version_id, day_name, name, category, sets, reps, duration, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newVersion.id,
            ex.day_name || 'Monday',
            ex.name,
            ex.category || 'STRENGTH',
            ex.sets || null,
            ex.reps || null,
            ex.duration || null,
            ex.notes || '',
            index
          ]
        );
      });
      await Promise.all(exerciseQueries);
    }

    await client.query('COMMIT');

    // Fetch the complete plan to return
    const exercisesResult = await pool.query(
      `SELECT * FROM workout_plan_exercises WHERE workout_plan_version_id = $1 ORDER BY order_index ASC`,
      [newVersion.id]
    );

    res.status(201).json({
      ...newVersion,
      exercises: exercisesResult.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating workout plan:', err);
    res.status(500).json({ error: 'Failed to create workout plan' });
  } finally {
    client.release();
  }
};

module.exports = {
  getCurrentWorkoutPlan,
  getWorkoutPlanVersions,
  getWorkoutPlanById,
  createWorkoutPlan
};
