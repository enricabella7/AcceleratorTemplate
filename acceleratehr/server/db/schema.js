export function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brochure_assets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      file_type TEXT,
      file_size TEXT,
      file_path TEXT,
      original_name TEXT,
      visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS data_models (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      description TEXT,
      entities TEXT,
      relationships TEXT,
      tags TEXT,
      tables_json TEXT,
      diagram_path TEXT,
      excel_path TEXT,
      excel_name TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      description TEXT,
      embed_url TEXT,
      status TEXT DEFAULT 'coming_soon',
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_use_cases (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      tags TEXT,
      demo_url TEXT,
      has_builtin_demo INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kpis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      definition TEXT,
      formula TEXT,
      benchmark TEXT,
      frequency TEXT,
      importance TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrations: add columns if they don't exist (for existing databases)
  const cols = db.prepare("PRAGMA table_info(data_models)").all().map(c => c.name);
  if (!cols.includes('tables_json')) {
    db.exec("ALTER TABLE data_models ADD COLUMN tables_json TEXT");
  }
  if (!cols.includes('excel_path')) {
    db.exec("ALTER TABLE data_models ADD COLUMN excel_path TEXT");
  }
  if (!cols.includes('excel_name')) {
    db.exec("ALTER TABLE data_models ADD COLUMN excel_name TEXT");
  }
}
