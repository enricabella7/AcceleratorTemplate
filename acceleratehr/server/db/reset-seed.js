import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTables } from './schema.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'acceleratehr.db');

// Delete existing DB and recreate
import fs from 'fs';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Deleted existing database.');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

createTables(db);
seedDatabase(db);

console.log('Database reset and seeded successfully.');
db.close();
