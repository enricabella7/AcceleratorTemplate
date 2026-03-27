import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';

export default function kpiRoutes(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { domain, search } = req.query;
    let query = 'SELECT * FROM kpis';
    const params = [];
    const conditions = [];
    if (domain && domain !== 'all') {
      conditions.push('domain = ?');
      params.push(domain);
    }
    if (search) {
      conditions.push("(name LIKE ? OR definition LIKE ? OR formula LIKE ?)");
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY sort_order';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM kpis WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', authMiddleware, (req, res) => {
    const { name, domain, definition, formula, benchmark, frequency, importance } = req.body;
    const id = uuid();
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM kpis').get();
    db.prepare(`
      INSERT INTO kpis (id, name, domain, definition, formula, benchmark, frequency, importance, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, domain, definition, formula, benchmark, frequency, importance, (maxOrder.m || 0) + 1);
    const row = db.prepare('SELECT * FROM kpis WHERE id = ?').get(id);
    res.json(row);
  });

  // Bulk import from CSV
  router.post('/import', authMiddleware, (req, res) => {
    const { kpis } = req.body;
    if (!Array.isArray(kpis)) return res.status(400).json({ error: 'Expected kpis array' });
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM kpis').get();
    let order = (maxOrder.m || 0) + 1;
    const insert = db.prepare(`
      INSERT INTO kpis (id, name, domain, definition, formula, benchmark, frequency, importance, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const tx = db.transaction(() => {
      for (const k of kpis) {
        insert.run(uuid(), k.name, k.domain, k.definition || '', k.formula || '', k.benchmark || '', k.frequency || '', k.importance || '', order++);
      }
    });
    tx();
    res.json({ imported: kpis.length });
  });

  router.put('/:id', authMiddleware, (req, res) => {
    const { name, domain, definition, formula, benchmark, frequency, importance, sort_order } = req.body;
    db.prepare(`
      UPDATE kpis SET name = COALESCE(?, name), domain = COALESCE(?, domain),
      definition = COALESCE(?, definition), formula = COALESCE(?, formula),
      benchmark = COALESCE(?, benchmark), frequency = COALESCE(?, frequency),
      importance = COALESCE(?, importance), sort_order = COALESCE(?, sort_order),
      updated_at = datetime('now')
      WHERE id = ?
    `).run(name, domain, definition, formula, benchmark, frequency, importance, sort_order, req.params.id);
    const row = db.prepare('SELECT * FROM kpis WHERE id = ?').get(req.params.id);
    res.json(row);
  });

  router.delete('/:id', authMiddleware, (req, res) => {
    db.prepare('DELETE FROM kpis WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Batch reorder
  router.post('/reorder', authMiddleware, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
    const stmt = db.prepare('UPDATE kpis SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      ids.forEach((id, i) => stmt.run(i, id));
    });
    tx();
    res.json({ success: true });
  });

  return router;
}
