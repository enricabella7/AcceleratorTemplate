import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';

export default function aiUseCaseRoutes(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM ai_use_cases WHERE enabled = 1 ORDER BY sort_order').all();
    res.json(rows.map(parseTagsField));
  });

  router.get('/all', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM ai_use_cases ORDER BY sort_order').all();
    res.json(rows.map(parseTagsField));
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(parseTagsField(row));
  });

  router.post('/', authMiddleware, (req, res) => {
    const { title, icon, description, tags, demo_url, has_builtin_demo } = req.body;
    const id = uuid();
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM ai_use_cases').get();
    db.prepare(`
      INSERT INTO ai_use_cases (id, title, icon, description, tags, demo_url, has_builtin_demo, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, icon || '🤖', description, JSON.stringify(tags || []), demo_url || '', has_builtin_demo ? 1 : 0, (maxOrder.m || 0) + 1);
    const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(id);
    res.json(parseTagsField(row));
  });

  router.put('/:id', authMiddleware, (req, res) => {
    const { title, icon, description, tags, demo_url, has_builtin_demo, enabled, sort_order } = req.body;
    db.prepare(`
      UPDATE ai_use_cases SET title = COALESCE(?, title), icon = COALESCE(?, icon),
      description = COALESCE(?, description), tags = COALESCE(?, tags),
      demo_url = COALESCE(?, demo_url), has_builtin_demo = COALESCE(?, has_builtin_demo),
      enabled = COALESCE(?, enabled), sort_order = COALESCE(?, sort_order), updated_at = datetime('now')
      WHERE id = ?
    `).run(title, icon, description, tags ? JSON.stringify(tags) : null, demo_url, has_builtin_demo != null ? (has_builtin_demo ? 1 : 0) : null, enabled, sort_order, req.params.id);
    const row = db.prepare('SELECT * FROM ai_use_cases WHERE id = ?').get(req.params.id);
    res.json(parseTagsField(row));
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM ai_use_cases WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Batch reorder
  router.post('/reorder', authMiddleware, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
    const stmt = db.prepare('UPDATE ai_use_cases SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      ids.forEach((id, i) => stmt.run(i, id));
    });
    tx();
    res.json({ success: true });
  });

  return router;
}

function parseTagsField(row) {
  if (!row) return row;
  try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
  return row;
}
