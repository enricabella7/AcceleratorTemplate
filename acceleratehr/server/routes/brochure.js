import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function brochureRoutes(db) {
  const router = Router();

  // Public: list visible assets
  router.get('/', (req, res) => {
    const rows = db.prepare('SELECT * FROM brochure_assets WHERE visible = 1 ORDER BY sort_order').all();
    res.json(rows);
  });

  // Admin: list all assets
  router.get('/all', authMiddleware, (req, res) => {
    const rows = db.prepare('SELECT * FROM brochure_assets ORDER BY sort_order').all();
    res.json(rows);
  });

  // Admin: upload asset
  router.post('/', authMiddleware, upload.single('file'), (req, res) => {
    const { title, description } = req.body;
    const file = req.file;
    const id = uuid();
    const ext = file ? path.extname(file.originalname).replace('.', '').toUpperCase() : '';
    const fileSize = file ? formatBytes(file.size) : '';
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM brochure_assets').get();

    db.prepare(`
      INSERT INTO brochure_assets (id, title, description, file_type, file_size, file_path, original_name, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, description || '', ext, fileSize, file?.filename || '', file?.originalname || '', (maxOrder.m || 0) + 1);

    const row = db.prepare('SELECT * FROM brochure_assets WHERE id = ?').get(id);
    res.json(row);
  });

  // Admin: update asset
  router.put('/:id', authMiddleware, (req, res) => {
    const { title, description, visible, sort_order } = req.body;
    db.prepare(`
      UPDATE brochure_assets SET title = COALESCE(?, title), description = COALESCE(?, description),
      visible = COALESCE(?, visible), sort_order = COALESCE(?, sort_order), updated_at = datetime('now')
      WHERE id = ?
    `).run(title, description, visible, sort_order, req.params.id);
    const row = db.prepare('SELECT * FROM brochure_assets WHERE id = ?').get(req.params.id);
    res.json(row);
  });

  // Admin: delete asset
  router.delete('/:id', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT file_path FROM brochure_assets WHERE id = ?').get(req.params.id);
    if (row?.file_path) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', row.file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM brochure_assets WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  return router;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
