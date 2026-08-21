const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../db/lapor_jalan.sqlite');
const schemaPath = path.join(__dirname, '../db/schema_sqlite.sql');

// Ensure db directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;
let isSqliteReady = false;

try {
  const Database = require('better-sqlite3');
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');

  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    dbInstance.exec(schemaSql);
  }
  isSqliteReady = true;
  console.log(' Successfully connected to SQLite Database at:', dbPath);
} catch (e) {
  console.warn(' Notice on better-sqlite3, trying sqlite3 fallback:', e.message);
  try {
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database(dbPath);
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schemaSql);
    }
    console.log(' Successfully connected to SQLite via sqlite3 driver!');
    isSqliteReady = true;
  } catch (err2) {
    console.warn(' SQLite driver notice:', err2.message);
  }
}

// Universal query helper method
async function query(sql, params = []) {
  if (dbInstance) {
    try {
      const trimmedSql = sql.trim().toUpperCase();
      if (trimmedSql.startsWith('SELECT')) {
        const stmt = dbInstance.prepare(sql);
        const rows = stmt.all(...params);
        return [rows];
      } else {
        const stmt = dbInstance.prepare(sql);
        const info = stmt.run(...params);
        return [info];
      }
    } catch (err) {
      console.warn("SQLite Query Error:", err.message, "SQL:", sql);
      throw err;
    }
  }
  throw new Error("SQLite database driver is initializing...");
}

async function checkConnection() {
  return isSqliteReady;
}

module.exports = {
  pool: { query },
  dbInstance,
  dbPath,
  checkConnection
};
