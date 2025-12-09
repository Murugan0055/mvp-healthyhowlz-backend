const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/003_profile_and_measurements.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Running migration: Profile and Measurements...');
    await pool.query(sql);
    console.log('✅ Migration successful! Profile and measurement tables created.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
