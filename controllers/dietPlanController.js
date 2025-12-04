const { pool } = require('../db');

// Get current active diet plan for a client
const getCurrentDietPlan = async (req, res) => {
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    // 1. Get the active version
    const versionResult = await pool.query(
      `SELECT * FROM diet_plan_versions
       WHERE client_id = $1 AND followed_till IS NULL
       LIMIT 1`,
      [clientId]
    );

    if (versionResult.rows.length === 0) {
      // Return 404 but with a specific message so frontend can handle "No Plan Assigned"
      return res.status(404).json({ message: 'No active diet plan found' });
    }

    const version = versionResult.rows[0];

    // 2. Get meals for this version
    const mealsResult = await pool.query(
      `SELECT * FROM diet_plan_meals
       WHERE diet_plan_version_id = $1
       ORDER BY order_index ASC`,
      [version.id]
    );

    const plan = {
      ...version,
      meals: mealsResult.rows
    };

    res.json(plan);
  } catch (err) {
    console.error('Error fetching current diet plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all diet plan versions for a client
const getDietPlanVersions = async (req, res) => {
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    const result = await pool.query(
      `SELECT id, title, followed_from, followed_till,
              (followed_till IS NULL) as is_current
       FROM diet_plan_versions
       WHERE client_id = $1
       ORDER BY followed_from DESC`,
      [clientId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching diet plan versions:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a specific diet plan version
const getDietPlanById = async (req, res) => {
  const { dietPlanVersionId } = req.params;
  const clientId = req.params.clientId === 'me' ? req.user.id : req.params.clientId;

  try {
    // 1. Get the version (verify ownership)
    const versionResult = await pool.query(
      `SELECT * FROM diet_plan_versions
       WHERE id = $1 AND client_id = $2`,
      [dietPlanVersionId, clientId]
    );

    if (versionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Diet plan version not found' });
    }

    const version = versionResult.rows[0];

    // 2. Get meals
    const mealsResult = await pool.query(
      `SELECT * FROM diet_plan_meals
       WHERE diet_plan_version_id = $1
       ORDER BY order_index ASC`,
      [version.id]
    );

    const plan = {
      ...version,
      meals: mealsResult.rows
    };

    res.json(plan);
  } catch (err) {
    console.error('Error fetching diet plan:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getCurrentDietPlan,
  getDietPlanVersions,
  getDietPlanById
};
