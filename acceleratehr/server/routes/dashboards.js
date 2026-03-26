import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';

export default function dashboardRoutes(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM dashboards ORDER BY sort_order').all();
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', authMiddleware, (req, res) => {
    const { title, domain, description, embed_url, status } = req.body;
    const id = uuid();
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM dashboards').get();
    db.prepare(`
      INSERT INTO dashboards (id, title, domain, description, embed_url, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, domain, description, embed_url || '', status || 'coming_soon', (maxOrder.m || 0) + 1);
    const row = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(id);
    res.json(row);
  });

  router.put('/:id', authMiddleware, (req, res) => {
    const { title, domain, description, embed_url, status, sort_order } = req.body;
    db.prepare(`
      UPDATE dashboards SET title = COALESCE(?, title), domain = COALESCE(?, domain),
      description = COALESCE(?, description), embed_url = COALESCE(?, embed_url),
      status = COALESCE(?, status), sort_order = COALESCE(?, sort_order), updated_at = datetime('now')
      WHERE id = ?
    `).run(title, domain, description, embed_url, status, sort_order, req.params.id);
    const row = db.prepare('SELECT * FROM dashboards WHERE id = ?').get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM dashboards WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  return router;
}
