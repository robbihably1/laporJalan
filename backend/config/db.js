const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// Check if running on Vercel Serverless Environment or Production
const isVercel = !!process.env.VERCEL;

const sourceDbPath = path.join(__dirname, '../db/lapor_jalan.sqlite');

// On Vercel Serverless, use writable /tmp directory; otherwise use local db file path
const dbPath = isVercel 
  ? path.join('/tmp', 'lapor_jalan.sqlite') 
  : sourceDbPath;

const schemaPath = path.join(__dirname, '../db/schema_sqlite.sql');

// Ensure db directory exists & copy source SQLite file if running in Serverless (/tmp)
try {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Copy pre-populated lapor_jalan.sqlite file to writable /tmp directory if needed
  if (isVercel && fs.existsSync(sourceDbPath) && dbPath !== sourceDbPath) {
    if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
      fs.copyFileSync(sourceDbPath, dbPath);
      console.log(' Successfully copied seed lapor_jalan.sqlite database to:', dbPath);
    }
  }
} catch (err) {
  console.warn("Notice on DB file/directory setup:", err.message);
}

let mysqlPool = null;
let dbInstance = null;
let isSqliteReady = false;

// Default hashed password for fallback ('123456')
const DEFAULT_HASHED_PASS = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW';

let MEMORY_ADMINS = [
  {
    id: "ADM-001",
    name: "Administrator Bina Marga",
    email: "robbihably10@gmail.com",
    password: DEFAULT_HASHED_PASS,
    role: "admin"
  }
];

const DELETED_USERS_SET = new Set();

// In-Memory Data Store fallback when running on Vercel Serverless without C++ native SQLite binary
let MEMORY_USERS = [
  {
    id: "USR-0001",
    nik: "3171012304950001",
    name: "Ahmad Subagja",
    email: "user@laporjalan.go.id",
    password: DEFAULT_HASHED_PASS,
    phone: "081234567890",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    province: "Jawa Barat",
    city: "Kota Bogor",
    district: "Bogor Tengah",
    village: "Paledang",
    status: "Aktif",
    role: "user"
  },
  {
    id: "USR-1001",
    nik: "3271010000012345",
    name: "Budi Subagja",
    email: "budi.subagja1@example.com",
    password: DEFAULT_HASHED_PASS,
    phone: "0812-1007-5003",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
    province: "Jawa Barat",
    city: "Kota Bogor",
    district: "Bogor Tengah",
    village: "Paledang",
    status: "Aktif",
    role: "user"
  }
];

let MEMORY_REPORTS = [
  {
    id: "REP-2026-0812-001",
    title: "Lubang Dalam di Lampu Merah Jl. Sudirman",
    category: "Jalan Berlubang",
    severity: "Parah",
    description: "Terdapat lubang berdiameter ~60cm dengan kedalaman 15cm persis di lajur kanan dekat perempatan lampu merah. Sangat membahayakan pengendara motor di malam hari.",
    location_name: "Jl. Jend. Sudirman No. 42, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8219,
    photo_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop",
    status: "Diproses",
    created_at: "2026-08-12 14:30:00",
    user_name: "Ahmad Subagja",
    user_phone: "081234567890"
  },
  {
    id: "REP-2026-0810-002",
    title: "Jalan Ambles Akibat Luapan Sungai Ciliwung",
    category: "Jalan Ambles",
    severity: "Darurat",
    description: "Bahu jalan sepanjang 4 meter ambles ke arah bantaran sungai setelah hujan deras kemarin malam. Akses mobil terputus setengah badan jalan.",
    location_name: "Jl. Lapangan Tembak, Cibubur, Jakarta Timur",
    latitude: -6.3688,
    longitude: 106.8919,
    photo_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=800&auto=format&fit=crop",
    status: "Menunggu",
    created_at: "2026-08-10 09:15:00",
    user_name: "Budi Santoso",
    user_phone: "081987654321"
  },
  {
    id: "REP-2026-0805-003",
    title: "Retak Rambut Panjang di Akses Tol Jagorawi",
    category: "Retak & Penerangan",
    severity: "Sedang",
    description: "Retakan memanjang sekitar 10 meter di lajur kiri. Belum parah tapi berpotensi terkelupas jika sering dilalui truk muatan berat.",
    location_name: "Jl. Raya Bogor KM 28, Ciracas, Jakarta Timur",
    latitude: -6.3288,
    longitude: 106.8619,
    photo_url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    status: "Selesai",
    created_at: "2026-08-05 16:45:00",
    user_name: "Siti Rahma",
    user_phone: "085712345678"
  }
];

let MEMORY_TIMELINES = [
  { report_id: "REP-2026-0812-001", status: "Menunggu", note: "Laporan berhasil diterima oleh sistem.", timestamp: "2026-08-12 14:30:00" },
  { report_id: "REP-2026-0812-001", status: "Diproses", note: "Tim verifikasi Dinas Bina Marga telah meninjau lokasi.", timestamp: "2026-08-13 10:00:00" }
];

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
    const dbFileExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;
    dbInstance = new Database(dbPath, { timeout: 5000 });

    try {
      dbInstance.pragma('journal_mode = WAL');
    } catch (walErr) {
      console.warn("WAL pragma notice:", walErr.message);
    }

    if (!dbFileExists && fs.existsSync(schemaPath)) {
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
      const dbFileExists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;
      if (!dbFileExists && fs.existsSync(schemaPath)) {
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

  // Safe Memory Data Engine Fallback for Vercel Serverless
  const sqlUpper = sql.trim().toUpperCase();

  if (sqlUpper.includes("FROM ADMIN")) {
    if (sqlUpper.includes("WHERE EMAIL = ?")) {
      const email = params[0];
      const match = MEMORY_ADMINS.filter(a => a.email === email);
      return [match];
    }
    if (sqlUpper.includes("WHERE ID = ?")) {
      const id = params[0];
      const match = MEMORY_ADMINS.filter(a => a.id === id || a.email === params[1]);
      return [match];
    }
    return [MEMORY_ADMINS];
  }

  if (sqlUpper.includes("FROM USERS")) {
    let activeUsers = MEMORY_USERS.filter(u => 
      !DELETED_USERS_SET.has(u.id) && 
      !DELETED_USERS_SET.has(u.email) && 
      (!u.nik || !DELETED_USERS_SET.has(u.nik))
    );

    if (sqlUpper.includes("WHERE EMAIL = ? OR (NIK = ?")) {
      const email = params[0];
      const nik = params[1];
      const match = activeUsers.filter(u => u.email === email || (nik && u.nik === nik));
      return [match];
    }
    if (sqlUpper.includes("WHERE VERIFICATION_TOKEN = ?")) {
      const token = params[0];
      const match = activeUsers.filter(u => u.verification_token === token);
      return [match];
    }
    if (sqlUpper.includes("WHERE ID = ?")) {
      const id = params[0];
      const match = activeUsers.filter(u => u.id === id);
      return [match];
    }
    if (sqlUpper.includes("WHERE EMAIL = ?")) {
      const email = params[0];
      const match = activeUsers.filter(u => u.email === email);
      return [match];
    }
    return [activeUsers];
  }

  if (sqlUpper.includes("INSERT INTO USERS")) {
    const newUser = {
      id: params[0],
      nik: params[1],
      name: params[2],
      email: params[3],
      password: params[4],
      phone: params[5],
      avatar: params[6],
      province: params[7],
      city: params[8],
      district: params[9],
      village: params[10],
      status: params[11] || 'Nonaktif',
      verification_token: params[12],
      role: 'user'
    };
    MEMORY_USERS.push(newUser);
    return [{ affectedRows: 1 }];
  }

  if (sqlUpper.includes("UPDATE USERS SET STATUS")) {
    let newStatus = 'Aktif';
    let targetId = params[0];

    if (sqlUpper.includes("STATUS = 'AKTIF'")) {
      newStatus = 'Aktif';
      targetId = params[0];
    } else if (sqlUpper.includes("STATUS = 'NONAKTIF'")) {
      newStatus = 'Nonaktif';
      targetId = params[0];
    } else if (params[0] === 'Aktif' || params[0] === 'Nonaktif') {
      newStatus = params[0];
      targetId = params[1];
    }

    const user = MEMORY_USERS.find(u => 
      (targetId && (u.id === targetId || u.email === targetId || u.verification_token === targetId)) ||
      (params[1] && (u.id === params[1] || u.email === params[1]))
    );

    if (user) {
      user.status = newStatus;
      if (newStatus === 'Aktif') {
        user.verification_token = null;
      }
    }
    return [{ affectedRows: 1 }];
  }

  if (sqlUpper.includes("DELETE FROM USERS")) {
    const targetId = params[0];
    MEMORY_USERS = MEMORY_USERS.filter(u => u.id !== targetId && u.email !== targetId);
    return [{ affectedRows: 1 }];
  }

  if (sqlUpper.includes("FROM REPORTS")) {
    let filtered = [...MEMORY_REPORTS];
    if (params.length > 0 && sqlUpper.includes("WHERE STATUS = ?")) {
      filtered = filtered.filter(r => r.status === params[0]);
    }
    return [filtered];
  }

  if (sqlUpper.includes("FROM REPORT_TIMELINES")) {
    return [MEMORY_TIMELINES];
  }

  if (sqlUpper.includes("INSERT INTO REPORTS")) {
    const newReport = {
      id: params[0],
      title: params[1],
      category: params[2],
      severity: params[3],
      description: params[4],
      location_name: params[5],
      latitude: params[6],
      longitude: params[7],
      photo_url: params[8],
      status: params[9] || 'Menunggu',
      created_at: params[10] || new Date().toISOString(),
      user_name: params[11] || 'Masyarakat',
      user_phone: params[12] || '-'
    };
    MEMORY_REPORTS.unshift(newReport);
    return [{ affectedRows: 1 }];
  }

  return [[]];
}

async function checkConnection() {
  return isSqliteReady || !!mysqlPool || isVercel;
}

module.exports = {
  pool: { query },
  dbInstance,
  dbPath,
  checkConnection,
  MEMORY_USERS,
  DELETED_USERS_SET
};
