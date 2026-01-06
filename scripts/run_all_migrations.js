const { pool } = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../db/migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  console.log('Starting migrations...');

  for (const file of files) {
    if (file.endsWith('.sql')) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      try {
        await pool.query(sql);
        console.log(`Successfully completed: ${file}`);
      } catch (err) {
        console.error(`Error in migration ${file}:`, err.message);
        // If it's a "relation already exists" error, we can skip it for simple scripts
        if (err.code !== '42P07' && err.code !== '42701') {
          // 42P07 = relation already exists, 42701 = column already exists
          process.exit(1);
        }
      }
    }
  }

  console.log('All migrations processed.');
  process.exit(0);
}

runMigrations();
