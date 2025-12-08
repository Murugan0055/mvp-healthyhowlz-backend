const { pool } = require('../db');

const seed = async () => {
  try {
    // 1. Get User
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found. Create a user first.');
      process.exit(1);
    }
    const userId = userRes.rows[0].id;

    console.log(`Seeding workouts for user ${userId}...`);

    // --- PLAN 1: Beginner Workout Plan (Active) ---
    const beginnerPlanRes = await pool.query(
      `INSERT INTO workout_plan_versions (client_id, title, description, followed_from, followed_till)
       VALUES ($1, 'Beginner Workout Plan', 'A comprehensive beginner plan with cardio and strength mix', CURRENT_DATE, NULL)
       RETURNING id`,
      [userId]
    );
    const beginnerId = beginnerPlanRes.rows[0].id;

    const beginnerExercises = [
      // Monday
      { day: 'Monday', name: 'Warmup treadmill', duration: '10 mins', category: 'CARDIO' },
      { day: 'Monday', name: 'Shoulder mobility', sets: 1, category: 'STRENGTH' },
      { day: 'Monday', name: 'Chest press machine', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Monday', name: 'Pec flies', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Monday', name: 'Incline dumbbell press', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Monday', name: 'Bent arm pullover', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Monday', name: 'Triceps pushdown', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Monday', name: 'Overhead extension', sets: 2, reps: '12', category: 'STRENGTH' },

      // Tuesday
      { day: 'Tuesday', name: 'Leg stretches', category: 'STRENGTH' },
      { day: 'Tuesday', name: 'Warmup treadmill', duration: '20 mins', category: 'CARDIO' },
      { day: 'Tuesday', name: 'Machine crunch', sets: 2, reps: '15', category: 'STRENGTH' },
      { day: 'Tuesday', name: 'EFX', duration: '15 mins', category: 'CARDIO' },
      { day: 'Tuesday', name: 'Heel touch', sets: 2, duration: '30 sec', category: 'STRENGTH' },
      { day: 'Tuesday', name: 'Spin bike', duration: '15 mins', category: 'CARDIO' },
      { day: 'Tuesday', name: 'Deadbug', sets: 2, duration: '30 sec', category: 'STRENGTH' },

      // Wednesday
      { day: 'Wednesday', name: 'Warmup treadmill', duration: '10 mins', category: 'CARDIO' },
      { day: 'Wednesday', name: 'Mobility and flexibility', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Wide pull down', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Mid row', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Close grip pulldown', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Hyperextension', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Cable curl', sets: 2, reps: '12', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Preacher curl', sets: 2, reps: '12', category: 'STRENGTH' },

      // Thursday (Same as Tuesday)
      { day: 'Thursday', name: 'Leg stretches', category: 'STRENGTH' },
      { day: 'Thursday', name: 'Warmup treadmill', duration: '20 mins', category: 'CARDIO' },
      { day: 'Thursday', name: 'Machine crunch', sets: 2, reps: '15', category: 'STRENGTH' },
      { day: 'Thursday', name: 'EFX', duration: '15 mins', category: 'CARDIO' },
      { day: 'Thursday', name: 'Heel touch', sets: 2, duration: '30 sec', category: 'STRENGTH' },
      { day: 'Thursday', name: 'Spin bike', duration: '15 mins', category: 'CARDIO' },
      { day: 'Thursday', name: 'Deadbug', sets: 2, duration: '30 sec', category: 'STRENGTH' },

      // Friday
      { day: 'Friday', name: 'Warmup treadmill', duration: '15 mins', category: 'CARDIO' },
      { day: 'Friday', name: 'Leg stretches', category: 'STRENGTH' },
      { day: 'Friday', name: 'Leg extension', category: 'STRENGTH' },
      { day: 'Friday', name: 'Leg curl', category: 'STRENGTH' },
      { day: 'Friday', name: 'Leg press', category: 'STRENGTH' },
      { day: 'Friday', name: 'Abduction', category: 'STRENGTH' },
      { day: 'Friday', name: 'Calf rise', category: 'STRENGTH' },

      // Saturday (Same as Tuesday)
      { day: 'Saturday', name: 'Leg stretches', category: 'STRENGTH' },
      { day: 'Saturday', name: 'Warmup treadmill', duration: '20 mins', category: 'CARDIO' },
      { day: 'Saturday', name: 'Machine crunch', sets: 2, reps: '15', category: 'STRENGTH' },
      { day: 'Saturday', name: 'EFX', duration: '15 mins', category: 'CARDIO' },
      { day: 'Saturday', name: 'Heel touch', sets: 2, duration: '30 sec', category: 'STRENGTH' },
      { day: 'Saturday', name: 'Spin bike', duration: '15 mins', category: 'CARDIO' },
      { day: 'Saturday', name: 'Deadbug', sets: 2, duration: '30 sec', category: 'STRENGTH' },
    ];

    let order = 1;
    for (const ex of beginnerExercises) {
      await pool.query(
        `INSERT INTO workout_plan_exercises (workout_plan_version_id, day_name, name, sets, reps, duration, category, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [beginnerId, ex.day, ex.name, ex.sets || null, ex.reps || null, ex.duration || null, ex.category, order++]
      );
    }

    // --- PLAN 2: Strength Training (Inactive) ---
    const strengthPlanRes = await pool.query(
      `INSERT INTO workout_plan_versions (client_id, title, description, followed_from, followed_till)
       VALUES ($1, 'Strength Training Split', 'Focus on muscle groups split by days', '2025-01-01', CURRENT_DATE)
       RETURNING id`,
      [userId]
    );
    const strengthId = strengthPlanRes.rows[0].id;

    const strengthExercises = [
      // Monday
      { day: 'Monday', name: 'Abs: Decline situps / Russian twist / Plank', category: 'STRENGTH' },
      { day: 'Monday', name: 'Chest: Incline press / Flat press / Decline press', category: 'STRENGTH' },
      { day: 'Monday', name: 'Chest: Cable cross over / Pec flies / Double bar dips', category: 'STRENGTH' },
      { day: 'Monday', name: 'Shoulder: Front rise and Side rise', category: 'STRENGTH' },

      // Tuesday
      { day: 'Tuesday', name: 'Lat: Wide pull down / Mid row / Standing rope pull down', category: 'STRENGTH' },
      { day: 'Tuesday', name: 'Lat: Close grip pull down / Dumbbell row / Hyper extension', category: 'STRENGTH' },
      { day: 'Tuesday', name: 'Biceps: Dumbbell curl / Preacher curl / Hammer curl', category: 'STRENGTH' },

      // Wednesday
      { day: 'Wednesday', name: 'Leg: Stretches', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Leg: Leg extension / Static lunges / Stiff leg deadlift', category: 'STRENGTH' },
      { day: 'Wednesday', name: 'Leg: Hamstring curl / Rope extension for glute / Calf rise', category: 'STRENGTH' },

      // Thursday
      { day: 'Thursday', name: 'Abs: Rope weighted crunch / Knee tuck', category: 'STRENGTH' },
      { day: 'Thursday', name: 'Shoulder: Military press / Lateral rise / Front rise', category: 'STRENGTH' },
      { day: 'Thursday', name: 'Shoulder: Rear flies / Shrugs', category: 'STRENGTH' },
      { day: 'Thursday', name: 'Triceps: Push down / Overhead extension', category: 'STRENGTH' },

      // Saturday
      { day: 'Saturday', name: 'Abs: Hanging leg rise / Rope crunch weighted', category: 'STRENGTH' },
      { day: 'Saturday', name: 'Leg: Free squat', sets: 3, reps: '20', category: 'STRENGTH' },
      { day: 'Saturday', name: 'Leg: Leg extension / Walking lunges / Sumo squat', category: 'STRENGTH' },
      { day: 'Saturday', name: 'Leg: Hamstring curl / Hip thrust / Calf rise', category: 'STRENGTH' },
    ];

    order = 1;
    for (const ex of strengthExercises) {
      await pool.query(
        `INSERT INTO workout_plan_exercises (workout_plan_version_id, day_name, name, sets, reps, duration, category, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [strengthId, ex.day, ex.name, ex.sets || null, ex.reps || null, ex.duration || null, ex.category, order++]
      );
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
