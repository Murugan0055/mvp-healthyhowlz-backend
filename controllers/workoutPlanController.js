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

module.exports = {
  getCurrentWorkoutPlan,
  getWorkoutPlanVersions,
  getWorkoutPlanById
};
