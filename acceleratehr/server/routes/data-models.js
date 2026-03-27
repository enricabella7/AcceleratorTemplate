import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { parseDataModelExcel } from '../lib/excel-parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

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

  // Admin: create (manual or via Excel upload)
  const uploadFields = upload.fields([
    { name: 'diagram', maxCount: 1 },
    { name: 'excel', maxCount: 1 },
  ]);

  router.post('/', authMiddleware, uploadFields, (req, res) => {
    const { title, domain, description, entities, relationships, tags } = req.body;
    const id = uuid();
    const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM data_models').get();

    const diagramFile = req.files?.diagram?.[0];
    const excelFile = req.files?.excel?.[0];

    let tablesJson = null;
    let finalTitle = title;
    let finalDescription = description;
    let finalEntities = entities;
    let finalRelationships = relationships;
    let finalTags = tags;

    // If an Excel file was uploaded, parse it
    if (excelFile) {
      try {
        const parsed = parseDataModelExcel(path.join(uploadsDir, excelFile.filename));
        tablesJson = JSON.stringify(parsed.tables);

        // Use parsed data as defaults if not provided manually
        if (!finalTitle) finalTitle = parsed.title;
        if (!finalDescription) finalDescription = parsed.description;

        // Auto-derive entities from tables
        if (!finalEntities) {
          const autoEntities = parsed.tables.map(t => ({
            name: t.businessName || t.tableName,
            fields: t.fields.map(f =>
              `${f.dwhFieldName} (${f.datatype})${f.primaryKey ? ' PK' : ''}${f.foreignKey ? ' FK→' + f.foreignKey : ''}`
            ),
          }));
          finalEntities = JSON.stringify(autoEntities);
        }

        // Auto-derive relationships from foreign keys
        if (!finalRelationships) {
          const rels = [];
          for (const t of parsed.tables) {
            for (const f of t.fields) {
              if (f.foreignKey) {
                const targetTable = parsed.tables.find(
                  x => x.tableName === f.foreignKey || x.businessName === f.foreignKey
                );
                const targetName = targetTable?.businessName || f.foreignKey;
                rels.push(`${t.businessName} → ${targetName} (via ${f.fieldName})`);
              }
            }
          }
          finalRelationships = JSON.stringify(rels);
        }

        // Auto-derive tags from table names
        if (!finalTags) {
          const autoTags = parsed.tables.map(t => t.businessName || t.sheetName);
          finalTags = JSON.stringify(autoTags);
        }
      } catch (err) {
        console.error('Excel parse error:', err);
        return res.status(400).json({ error: 'Failed to parse Excel file: ' + err.message });
      }
    }

    db.prepare(`
      INSERT INTO data_models (id, title, domain, description, entities, relationships, tags, tables_json, diagram_path, excel_path, excel_name, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      finalTitle || 'Untitled Model',
      domain || 'workforce_planning',
      finalDescription || '',
      finalEntities || '[]',
      finalRelationships || '[]',
      finalTags || '[]',
      tablesJson,
      diagramFile?.filename || '',
      excelFile?.filename || '',
      excelFile?.originalname || '',
      (maxOrder.m || 0) + 1
    );

    const row = db.prepare('SELECT * FROM data_models WHERE id = ?').get(id);
    res.json(parseJsonFields(row));
  });

  // Admin: update
  router.put('/:id', authMiddleware, uploadFields, (req, res) => {
    const { title, domain, description, entities, relationships, tags, sort_order } = req.body;

    const diagramFile = req.files?.diagram?.[0];
    const excelFile = req.files?.excel?.[0];

    let tablesJson = undefined;
    let excelPath = undefined;
    let excelName = undefined;

    // If new Excel uploaded, re-parse
    if (excelFile) {
      try {
        const parsed = parseDataModelExcel(path.join(uploadsDir, excelFile.filename));
        tablesJson = JSON.stringify(parsed.tables);
        excelPath = excelFile.filename;
        excelName = excelFile.originalname;

        // Delete old Excel file
        const existing = db.prepare('SELECT excel_path FROM data_models WHERE id = ?').get(req.params.id);
        if (existing?.excel_path) {
          const oldPath = path.join(uploadsDir, existing.excel_path);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (err) {
        return res.status(400).json({ error: 'Failed to parse Excel file: ' + err.message });
      }
    }

    // Build dynamic update
    let sql = `UPDATE data_models SET
      title = COALESCE(?, title),
      domain = COALESCE(?, domain),
      description = COALESCE(?, description),
      entities = COALESCE(?, entities),
      relationships = COALESCE(?, relationships),
      tags = COALESCE(?, tags),
      sort_order = COALESCE(?, sort_order)`;

    const params = [title, domain, description, entities, relationships, tags, sort_order];

    if (diagramFile) {
      sql += ', diagram_path = ?';
      params.push(diagramFile.filename);
      // Delete old diagram
      const existing = db.prepare('SELECT diagram_path FROM data_models WHERE id = ?').get(req.params.id);
      if (existing?.diagram_path) {
        const oldPath = path.join(uploadsDir, existing.diagram_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    if (tablesJson !== undefined) {
      sql += ', tables_json = ?, excel_path = ?, excel_name = ?';
      params.push(tablesJson, excelPath, excelName);
    }

    sql += ", updated_at = datetime('now') WHERE id = ?";
    params.push(req.params.id);

    db.prepare(sql).run(...params);
    const row = db.prepare('SELECT * FROM data_models WHERE id = ?').get(req.params.id);
    res.json(parseJsonFields(row));
  });

  // Admin: delete
  router.delete('/:id', authMiddleware, (req, res) => {
    const row = db.prepare('SELECT diagram_path, excel_path FROM data_models WHERE id = ?').get(req.params.id);
    if (row?.diagram_path) {
      const fp = path.join(uploadsDir, row.diagram_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    if (row?.excel_path) {
      const fp = path.join(uploadsDir, row.excel_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    db.prepare('DELETE FROM data_models WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // Batch reorder
  router.post('/reorder', authMiddleware, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' });
    const stmt = db.prepare('UPDATE data_models SET sort_order = ? WHERE id = ?');
    const tx = db.transaction(() => {
      ids.forEach((id, i) => stmt.run(i, id));
    });
    tx();
    res.json({ success: true });
  });

  return router;
}

function parseJsonFields(row) {
  if (!row) return row;
  try { row.entities = JSON.parse(row.entities || '[]'); } catch { row.entities = []; }
  try { row.relationships = JSON.parse(row.relationships || '[]'); } catch { row.relationships = []; }
  try { row.tags = JSON.parse(row.tags || '[]'); } catch { row.tags = []; }
  try { row.tables_json = JSON.parse(row.tables_json || 'null'); } catch { row.tables_json = null; }
  return row;
}
