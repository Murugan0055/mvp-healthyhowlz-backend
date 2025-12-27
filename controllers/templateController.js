const { pool } = require('../db');

// --- DIET TEMPLATES ---

exports.getDietTemplates = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const result = await pool.query(
      'SELECT dt.*, (SELECT COUNT(*) FROM diet_template_meals dtm WHERE dtm.diet_template_id = dt.id) as meals_count FROM diet_templates dt WHERE trainer_id = $1 ORDER BY created_at DESC',
      [trainerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get diet templates error:', err);
    res.status(500).json({ error: 'Failed to fetch diet templates' });
  }
};

exports.createDietTemplate = async (req, res) => {
  const { name, description, meals } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      'INSERT INTO diet_templates (trainer_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [trainerId, name, description]
    );
    const templateId = templateResult.rows[0].id;

    if (meals && meals.length > 0) {
      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        await client.query(
          `INSERT INTO diet_template_meals 
           (diet_template_id, meal_type, name, description, protein_g, carbs_g, fat_g, calories_kcal, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            templateId, meal.meal_type, meal.name, meal.description,
            meal.protein_g ? Math.round(meal.protein_g * 100) / 100 : 0,
            meal.carbs_g ? Math.round(meal.carbs_g * 100) / 100 : 0,
            meal.fat_g ? Math.round(meal.fat_g * 100) / 100 : 0,
            meal.calories_kcal ? Math.round(meal.calories_kcal * 100) / 100 : 0,
            i
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(templateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create diet template error:', err);
    res.status(500).json({ error: 'Failed to create diet template' });
  } finally {
    client.release();
  }
};

exports.updateDietTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, description, meals } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      'UPDATE diet_templates SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 AND trainer_id = $4 RETURNING *',
      [name, description, id, trainerId]
    );

    if (templateResult.rows.length === 0) {
      throw new Error('Template not found or access denied');
    }

    await client.query('DELETE FROM diet_template_meals WHERE diet_template_id = $1', [id]);

    if (meals && meals.length > 0) {
      for (let i = 0; i < meals.length; i++) {
        const meal = meals[i];
        await client.query(
          `INSERT INTO diet_template_meals 
           (diet_template_id, meal_type, name, description, protein_g, carbs_g, fat_g, calories_kcal, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id, meal.meal_type, meal.name, meal.description,
            meal.protein_g ? Math.round(meal.protein_g * 100) / 100 : 0,
            meal.carbs_g ? Math.round(meal.carbs_g * 100) / 100 : 0,
            meal.fat_g ? Math.round(meal.fat_g * 100) / 100 : 0,
            meal.calories_kcal ? Math.round(meal.calories_kcal * 100) / 100 : 0,
            i
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json(templateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update diet template error:', err);
    res.status(err.message === 'Template not found or access denied' ? 404 : 500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getDietTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    const templateResult = await pool.query(
      'SELECT * FROM diet_templates WHERE id = $1 AND trainer_id = $2',
      [id, trainerId]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const mealsResult = await pool.query(
      'SELECT * FROM diet_template_meals WHERE diet_template_id = $1 ORDER BY order_index ASC',
      [id]
    );

    res.json({
      ...templateResult.rows[0],
      meals: mealsResult.rows
    });
  } catch (err) {
    console.error('Get diet template by id error:', err);
    res.status(500).json({ error: 'Failed to fetch diet template' });
  }
};

exports.deleteDietTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    const result = await pool.query(
      'DELETE FROM diet_templates WHERE id = $1 AND trainer_id = $2 RETURNING id',
      [id, trainerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfuly', id });
  } catch (err) {
    console.error('Delete diet template error:', err);
    res.status(500).json({ error: 'Failed to delete diet template' });
  }
};

// --- WORKOUT TEMPLATES ---

exports.getWorkoutTemplates = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const result = await pool.query(
      'SELECT wt.*, (SELECT COUNT(*) FROM workout_template_exercises wte WHERE wte.workout_template_id = wt.id) as exercises_count FROM workout_templates wt WHERE trainer_id = $1 ORDER BY created_at DESC',
      [trainerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get workout templates error:', err);
    res.status(500).json({ error: 'Failed to fetch workout templates' });
  }
};

exports.createWorkoutTemplate = async (req, res) => {
  const { name, description, exercises } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      'INSERT INTO workout_templates (trainer_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [trainerId, name, description]
    );
    const templateId = templateResult.rows[0].id;

    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          `INSERT INTO workout_template_exercises 
           (workout_template_id, day_name, name, category, sets, reps, duration, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            templateId, ex.day_name || 'Monday', ex.name, ex.category || 'STRENGTH',
            ex.sets || null, ex.reps || '', ex.duration || '', ex.notes || '', i
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(templateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create workout template error:', err);
    res.status(500).json({ error: 'Failed to create workout template' });
  } finally {
    client.release();
  }
};

exports.updateWorkoutTemplate = async (req, res) => {
  const { id } = req.params;
  const { name, description, exercises } = req.body;
  const trainerId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const templateResult = await client.query(
      'UPDATE workout_templates SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 AND trainer_id = $4 RETURNING *',
      [name, description, id, trainerId]
    );

    if (templateResult.rows.length === 0) {
      throw new Error('Template not found or access denied');
    }

    await client.query('DELETE FROM workout_template_exercises WHERE workout_template_id = $1', [id]);

    if (exercises && exercises.length > 0) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          `INSERT INTO workout_template_exercises 
           (workout_template_id, day_name, name, category, sets, reps, duration, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            id, ex.day_name || 'Monday', ex.name, ex.category || 'STRENGTH',
            ex.sets || null, ex.reps || '', ex.duration || '', ex.notes || '', i
          ]
        );
      }
    }

    await client.query('COMMIT');
    res.json(templateResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update workout template error:', err);
    res.status(err.message === 'Template not found or access denied' ? 404 : 500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getWorkoutTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    const templateResult = await pool.query(
      'SELECT * FROM workout_templates WHERE id = $1 AND trainer_id = $2',
      [id, trainerId]
    );

    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const exercisesResult = await pool.query(
      'SELECT * FROM workout_template_exercises WHERE workout_template_id = $1 ORDER BY order_index ASC',
      [id]
    );

    res.json({
      ...templateResult.rows[0],
      exercises: exercisesResult.rows
    });
  } catch (err) {
    console.error('Get workout template by id error:', err);
    res.status(500).json({ error: 'Failed to fetch workout template' });
  }
};

exports.deleteWorkoutTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const trainerId = req.user.id;

    const result = await pool.query(
      'DELETE FROM workout_templates WHERE id = $1 AND trainer_id = $2 RETURNING id',
      [id, trainerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfuly', id });
  } catch (err) {
    console.error('Delete workout template error:', err);
    res.status(500).json({ error: 'Failed to delete workout template' });
  }
};
