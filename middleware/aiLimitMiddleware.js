const { pool } = require('../db');

const AI_DAILY_LIMIT = 7;

exports.checkAiLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Get current usage
    const result = await pool.query(
      'SELECT ai_usage_count, last_ai_usage_date FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { ai_usage_count, last_ai_usage_date } = result.rows[0];

    // Format db date to YYYY-MM-DD
    const dbDate = last_ai_usage_date ? new Date(last_ai_usage_date).toISOString().split('T')[0] : null;

    if (dbDate === today) {
      if (ai_usage_count >= AI_DAILY_LIMIT) {
        return res.status(429).json({
          error: 'Daily AI limit reached',
          message: `You have reached your daily limit of ${AI_DAILY_LIMIT} AI requests. Please try again tomorrow.`,
          limit: AI_DAILY_LIMIT
        });
      }
      // Usage is within limit, will increment after successful AI call in the controller
      // or we can increment here. Incrementing here is safer to prevent race conditions.
      await pool.query(
        'UPDATE users SET ai_usage_count = ai_usage_count + 1 WHERE id = $1',
        [userId]
      );
    } else {
      // New day, reset count
      await pool.query(
        'UPDATE users SET ai_usage_count = 1, last_ai_usage_date = $1 WHERE id = $2',
        [today, userId]
      );
    }

    next();
  } catch (err) {
    console.error('AI Limit Middleware Error:', err);
    res.status(500).json({ error: 'Internal server error checking AI limit' });
  }
};
