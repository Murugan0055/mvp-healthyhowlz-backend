const { pool } = require('../db');

// Get workout sessions (exercises + status) for a specific date OR range
const getWorkoutSessions = async (req, res) => {
  const userId = req.user.id;
  const { date, from_date, to_date } = req.query;

  try {
    if (date) {
      // 1. Find the plan active on this date
      const planResult = await pool.query(
        `SELECT id FROM workout_plan_versions
         WHERE client_id = $1
         AND followed_from <= $2
         AND (followed_till IS NULL OR followed_till >= $2)
         LIMIT 1`,
        [userId, date]
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
        [userId, date, planId]
      );

      res.json(exercisesResult.rows);
    } else if (from_date && to_date) {
      // Range logic
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

      const result = await pool.query(query, [userId, from_date, to_date]);
      res.json(result.rows);
    } else {
      return res.status(400).json({ error: 'Date or Date Range required' });
    }
  } catch (err) {
    console.error('Error fetching workout sessions:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark an exercise as complete
const markComplete = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // workout_plan_exercise_id
  const { date } = req.body;
  const file = req.file;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    // 1. Check exercise type
    const exerciseRes = await pool.query(
      'SELECT category FROM workout_plan_exercises WHERE id = $1',
      [id]
    );

    if (exerciseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const { category } = exerciseRes.rows[0];

    // 2. Validate Cardio Requirement
    let photoUrl = null;
    if (category === 'CARDIO') {
      if (!file) {
        return res.status(400).json({ error: 'Photo proof required for cardio workouts' });
      }
      // Construct URL (assuming server serves /uploads)
      photoUrl = `/uploads/${file.filename}`;
    }

    // 3. Insert completion
    await pool.query(
      `INSERT INTO workout_completions (user_id, workout_plan_exercise_id, date, machine_photo_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, workout_plan_exercise_id, date) 
       DO UPDATE SET machine_photo_url = EXCLUDED.machine_photo_url, completed_at = CURRENT_TIMESTAMP`,
      [userId, id, date, photoUrl]
    );

    res.json({ success: true, photoUrl });
  } catch (err) {
    console.error('Error marking complete:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Mark an exercise as incomplete
const markIncomplete = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // workout_plan_exercise_id
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    await pool.query(
      `DELETE FROM workout_completions
       WHERE user_id = $1 AND workout_plan_exercise_id = $2 AND date = $3`,
      [userId, id, date]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking incomplete:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getWorkoutSessions,
  markComplete,
  markIncomplete
};
