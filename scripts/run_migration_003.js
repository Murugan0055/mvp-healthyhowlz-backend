const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/003_add_cardio_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log('Running migration 003...');
    await pool.query(sql);
    console.log('Migration 003 successful!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
