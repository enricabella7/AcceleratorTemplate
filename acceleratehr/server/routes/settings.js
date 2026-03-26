import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export default function settingsRoutes(db) {
  const router = Router();

  // Public: get portal settings
  router.get('/', (req, res) => {
    const rows = db.prepare("SELECT key, value FROM settings WHERE key NOT LIKE 'admin_%'").all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  });

  // Admin: get all settings including admin ones
  router.get('/all', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  });

  // Admin: update settings
  router.put('/', authMiddleware, (req, res) => {
    const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?');
    const entries = Object.entries(req.body);
    const tx = db.transaction(() => {
      for (const [key, value] of entries) {
        upsert.run(key, String(value), String(value));
      }
    });
    tx();
    res.json({ success: true });
  });

  return router;
}
