const { pool } = require('../db');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  try {
    const migrationPath = path.join(__dirname, '../db/migrations/004_add_user_roles.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 004_add_user_roles.sql');
    await pool.query(migrationSql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
