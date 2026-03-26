import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { createTables } from './schema.js';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'acceleratehr.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

createTables(db);
seedDatabase(db);

export default db;
