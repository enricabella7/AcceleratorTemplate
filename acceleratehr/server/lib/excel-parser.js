import XLSX from 'xlsx';
import fs from 'fs';

/**
 * Parse an Excel data model file following the AccelerateHR template.
 *
 * Expected structure:
 * - Summary sheet: lists all tables with #, Table, Description
 * - Individual table sheets with:
 *   - Rows 2-11: Table-level settings (Table Name, Schema, Business Name, Granularity, Description, Volume, Scalability, Source tables, Relationships)
 *   - Row 14: Header row (# | Field Name | Description / Dictionary | Field Name | Datatype | Primary Key | Foreign Key | ... | Source Table | Source Field | Logic)
 *   - Rows 15+: Field definitions
 */
export function parseDataModelExcel(filePath) {
  const workbook = XLSX.readFile(filePath, { cellFormula: false });
  const sheetNames = workbook.SheetNames;

  const result = {
    title: '',
    description: '',
    tables: [],
  };

  // Try to extract info from Summary sheet
  const summarySheet = workbook.Sheets['Summary'];
  if (summarySheet) {
    const summaryData = XLSX.utils.sheet_to_json(summarySheet, { header: 1, defval: '' });
    // Summary typically has header in row 0, then table rows
    for (let i = 1; i < summaryData.length; i++) {
      const row = summaryData[i];
      if (row[1] && String(row[1]).trim()) {
        // We'll use this to validate table names
      }
    }
  }

  // Parse each table sheet (skip Summary and Model)
  const skipSheets = ['Summary', 'Model'];
  for (const sheetName of sheetNames) {
    if (skipSheets.includes(sheetName)) continue;

    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (data.length < 14) continue; // Need at least the header structure

    const tableInfo = parseTableSheet(data, sheetName);
    if (tableInfo) {
      result.tables.push(tableInfo);
    }
  }

  // Derive model title/description from first table or sheet names
  if (result.tables.length > 0) {
    // Try to build a meaningful title from the sheet collection
    const firstTable = result.tables[0];
    result.title = result.title || `Data Model (${result.tables.length} tables)`;
    result.description = result.description || `Contains ${result.tables.length} tables: ${result.tables.map(t => t.businessName || t.tableName).join(', ')}`;
  }

  return result;
}

function parseTableSheet(data, sheetName) {
  const table = {
    sheetName,
    tableName: '',
    schema: '',
    businessName: '',
    granularity: '',
    description: '',
    volume: '',
    scalability: '',
    sourceTables: '',
    relationships: '',
    fields: [],
  };

  // Parse table-level settings (rows 2-11, columns B=1, C=2, D=3)
  // Row indices are 0-based in our data array
  const settingMap = {
    'Table Name': 'tableName',
    'Database Schema': 'schema',
    'Business Name': 'businessName',
    'Granularity': 'granularity',
    'Table Description': 'description',
    'Volume': 'volume',
    'Scalability': 'scalability',
    'Source tables': 'sourceTables',
    'Relationships': 'relationships',
  };

  // Scan rows 1-11 for settings
  for (let i = 1; i <= Math.min(11, data.length - 1); i++) {
    const row = data[i];
    const label = String(row[1] || '').trim();
    const value = String(row[2] || '').trim();

    for (const [key, prop] of Object.entries(settingMap)) {
      if (label === key || label.startsWith(key)) {
        table[prop] = value;
      }
    }
  }

  // Find the field header row (look for "Field Name" in column B)
  let headerRowIdx = -1;
  for (let i = 12; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (String(row[1] || '').trim() === 'Field Name') {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    // Try a broader search
    for (let i = 0; i < Math.min(25, data.length); i++) {
      const row = data[i];
      if (String(row[1] || '').trim() === 'Field Name') {
        headerRowIdx = i;
        break;
      }
    }
  }

  if (headerRowIdx === -1) return table; // No fields found, still return table metadata

  // Parse field rows starting after header
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    const fieldName = String(row[1] || '').trim();
    if (!fieldName) continue; // Skip empty rows

    const field = {
      number: parseFieldNumber(row[0]),
      fieldName,
      description: String(row[2] || '').trim(),
      dwhFieldName: String(row[3] || '').trim(),
      datatype: String(row[4] || '').trim(),
      primaryKey: String(row[5] || '').trim().toUpperCase() === 'Y',
      foreignKey: String(row[6] || '').trim(),
    };

    // Try to get source info (columns 10, 11, 12 or 11, 12, 13 depending on layout)
    // Look for source table, source field, logic in the last 3 populated columns
    const lastCols = row.slice(10);
    const sourceInfo = lastCols.map(c => String(c || '').trim()).filter(Boolean);
    if (row.length >= 13) {
      field.sourceTable = String(row[10] || '').trim();
      field.sourceField = String(row[11] || '').trim();
      field.logic = String(row[12] || row[13] || '').trim();
    }

    table.fields.push(field);
  }

  return table;
}

function parseFieldNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  // Handle Excel formula references like "=A15+1"
  if (str.startsWith('=')) return null;
  const num = parseInt(str, 10);
  return isNaN(num) ? null : num;
}
