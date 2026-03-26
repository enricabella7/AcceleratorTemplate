import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function dataModelRoutes(db) {
  const router = Router();

  // Public: list all models
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM data_models ORDER BY sort_order').all();
    res.json(rows.map(parseJsonFields));
  });

  // Public: get single model
  router.get('/:id', (req, res) => {
    const row = db.prepare('SELECT * FROM data_models WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(parseJsonFields(row));
  });

  // Admin: create
  router.post('/', authMiddleware, upload.single('diagram'), (req, res) => {
    const { title, domain, description, entities, relationships, tags } = req.body;
    const id = uuid();
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM data_models').get();
    db.prepare(`
      INSERT INTO data_models (id, title, domain, description, entities, relationships, tags, diagram_path, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, domain, description, entities, relationships, tags, req.file?.filename || '', (maxOrder.m || 0) + 1);
    const row = db.prepare('SELECT * FROM data_models WHERE id = ?').get(id);
    res.json(parseJsonFields(row));
  });

  // Admin: update
  router.put('/:id', authMiddleware, upload.single('diagram'), (req, res) => {
    const { title, domain, description, entities, relationships, tags, sort_order } = req.body;
    let diagramUpdate = '';
    const params = [title, domain, description, entities, relationships, tags, sort_order];
    if (req.file) {
      diagramUpdate = ', diagram_path = ?';
      params.push(req.file.filename);
    }
    params.push(req.params.id);
    db.prepare(`
      UPDATE data_models SET title = COALESCE(?, title), domain = COALESCE(?, domain),
      description = COALESCE(?, description), entities = COALESCE(?, entities),
      relationships = COALESCE(?, relationships), tags = COALESCE(?, tags),
      sort_order = COALESCE(?, sort_order)${diagramUpdate}, updated_at = datetime('now')
      WHERE id = ?
    `).run(...params);
    const row = db.prepare('SELECT * FROM data_models WHERE id = ?').get(req.params.id);
    res.json(parseJsonFields(row));
  });

  // Admin: delete
  router.delete('/:id', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT diagram_path FROM data_models WHERE id = ?').get(req.params.id);
    if (row?.diagram_path) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', row.diagram_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM data_models WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  return router;
}

function parseJsonFields(row) {
  if (!row) return row;
  try { row.entities = JSON.parse(row.entities || '[]'); } catch { row.entities = []; }
  try { row.relationships = JSON.parse(row.relationships || '[]'); } catch { row.relationships = []; }
  try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
  return row;
}
