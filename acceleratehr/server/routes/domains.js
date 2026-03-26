import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

export default function domainRoutes(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM domains ORDER BY sort_order').all();
    res.json(rows);
  });

  router.post('/', authMiddleware, (req, res) => {
    const { id, label, color, icon } = req.body;
    if (!id || !label) return res.status(400).json({ error: 'id and label are required' });
    const domainId = id.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = db.prepare('SELECT id FROM domains WHERE id = ?').get(domainId);
    if (existing) return res.status(409).json({ error: 'Domain ID already exists' });
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM domains').get();
    db.prepare('INSERT INTO domains (id, label, color, icon, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(domainId, label, color || '#3B82F6', icon || 'Folder', (maxOrder.m || 0) + 1);
    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(domainId);
    res.json(row);
  });

  router.put('/:id', authMiddleware, (req, res) => {
    const { label, color, icon, sort_order } = req.body;
    db.prepare(`
      UPDATE domains SET label = COALESCE(?, label), color = COALESCE(?, color),
      icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order), updated_at = datetime('now')
      WHERE id = ?
    `).run(label, color, icon, sort_order, req.params.id);
    const row = db.prepare('SELECT * FROM domains WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM domains WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  return router;
}
