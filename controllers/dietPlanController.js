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

// Create a new diet plan version
const createDietPlan = async (req, res) => {
  const { clientId } = req.params;
  const { title, description, meals, isActive } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. If isActive is true, deactivate current active plan
    if (isActive) {
      await client.query(
        `UPDATE diet_plan_versions 
         SET followed_till = CURRENT_DATE, updated_at = NOW()
         WHERE client_id = $1 AND followed_till IS NULL`,
        [clientId]
      );
    }

    // 2. Create new version
    const followedFrom = new Date().toISOString().split('T')[0];
    const followedTill = isActive ? null : followedFrom; // If not active, mark it as "finished" immediately

    const versionResult = await client.query(
      `INSERT INTO diet_plan_versions (client_id, created_by_trainer_id, title, description, followed_from, followed_till)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [clientId, trainerId, title, description, followedFrom, followedTill]
    );

    const newVersion = versionResult.rows[0];

    // 3. Insert meals
    if (meals && meals.length > 0) {
      const mealQueries = meals.map((meal, index) => {
        return client.query(
          `INSERT INTO diet_plan_meals (diet_plan_version_id, meal_type, name, description, protein_g, carbs_g, fat_g, calories_kcal, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newVersion.id,
            meal.meal_type,
            meal.name,
            meal.description,
            meal.protein_g || 0,
            meal.carbs_g || 0,
            meal.fat_g || 0,
            meal.calories_kcal || 0,
            index
          ]
        );
      });
      await Promise.all(mealQueries);
    }

    await client.query('COMMIT');

    // Fetch the complete plan to return
    const mealsResult = await pool.query(
      `SELECT * FROM diet_plan_meals WHERE diet_plan_version_id = $1 ORDER BY order_index ASC`,
      [newVersion.id]
    );

    res.status(201).json({
      ...newVersion,
      meals: mealsResult.rows
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating diet plan:', err);
    res.status(500).json({ error: 'Failed to create diet plan' });
  } finally {
    client.release();
  }
};

module.exports = {
  getCurrentDietPlan,
  getDietPlanVersions,
  getDietPlanById,
  createDietPlan
};
