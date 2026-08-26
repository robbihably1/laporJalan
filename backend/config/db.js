const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// Check if running on Vercel Serverless Environment
const isVercel = !!process.env.VERCEL;

// On Vercel Serverless, use writable /tmp directory
const dbPath = isVercel 
  ? path.join('/tmp', 'lapor_jalan.sqlite') 
  : path.join(__dirname, '../db/lapor_jalan.sqlite');

const schemaPath = path.join(__dirname, '../db/schema_sqlite.sql');

// Ensure db directory exists
try {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.warn("Notice on mkdir for DB:", err.message);
}

let mysqlPool = null;
let dbInstance = null;
let isSqliteReady = false;

// 1. Try Cloud MySQL Pool if credentials are provided
if (process.env.DB_HOST) {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    console.log(` Connected to Cloud MySQL Database (${process.env.DB_HOST})`);
  } catch (err) {
    console.warn(" Cloud MySQL Connection Warning:", err.message);
  }
}

// 2. Try SQLite Driver with safe fallback
if (!mysqlPool) {
  try {
    const Database = require('better-sqlite3');
    dbInstance = new Database(dbPath, { timeout: 5000 });

    try {
      dbInstance.pragma('journal_mode = WAL');
    } catch (walErr) {
      console.warn("WAL pragma notice:", walErr.message);
    }

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      dbInstance.exec(schemaSql);
    }
    isSqliteReady = true;
    console.log(' Connected to SQLite Database at:', dbPath);
  } catch (e) {
    console.warn(' Notice on better-sqlite3, trying sqlite3 fallback:', e.message);
    try {
      const sqlite3 = require('sqlite3').verbose();
      const db = new sqlite3.Database(dbPath);
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schemaSql);
      }
      console.log(' Connected to SQLite via sqlite3 driver!');
      isSqliteReady = true;
    } catch (err2) {
      console.warn(' SQLite driver notice:', err2.message);
    }
  }
}

// Universal query helper method
async function query(sql, params = []) {
  if (mysqlPool) {
    try {
      const [rows] = await mysqlPool.query(sql, params);
      return [rows];
    } catch (err) {
      console.warn("MySQL Query Error:", err.message);
      throw err;
    }
  }

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

  console.warn("DB Query fallback mode (No active DB driver)");
  return [[]];
}

async function checkConnection() {
  return isSqliteReady || !!mysqlPool;
}

module.exports = {
  pool: { query },
  dbInstance,
  dbPath,
  checkConnection
};
