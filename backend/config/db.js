const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

// Check if running on Vercel Serverless Environment or Production
const isVercel = !!process.env.VERCEL;

let mysqlPool = null;

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

// 1. Try Cloud MySQL Pool (Supports Railway, Aiven, PlanetScale, TiDB, etc.)
const host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.RAILWAY_TCP_PROXY_DOMAIN;
const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD;
const database = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway';
const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.RAILWAY_TCP_PROXY_PORT || '3306');

if (process.env.MYSQL_URL || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql'))) {
  try {
    const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
    const dbUrl = new URL(rawUrl);
    mysqlPool = mysql.createPool({
      host: dbUrl.hostname,
      user: dbUrl.username || 'root',
      password: dbUrl.password,
      database: dbUrl.pathname.replace('/', '') || 'railway',
      port: parseInt(dbUrl.port || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
    console.log(` Connected to Cloud MySQL Database via URL (${dbUrl.hostname})`);
  } catch (err) {
    console.warn(" Cloud Database URL parse error:", err.message);
  }
} else if (host) {
  try {
    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
    console.log(` Connected to Cloud MySQL Database (${host}:${port})`);
  } catch (err) {
    console.warn(" Cloud MySQL Connection Warning:", err.message);
  }
}

// Auto-initialize Cloud MySQL tables if pool is created
if (mysqlPool) {
  (async () => {
    try {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS admin (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          nik VARCHAR(20),
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          avatar TEXT,
          province VARCHAR(100),
          city VARCHAR(100),
          district VARCHAR(100),
          village VARCHAR(100),
          status VARCHAR(20) DEFAULT 'Aktif',
          verification_token VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS reports (
          id VARCHAR(50) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL,
          description TEXT NOT NULL,
          location_name VARCHAR(255) NOT NULL,
          latitude DOUBLE NOT NULL,
          longitude DOUBLE NOT NULL,
          photo_url TEXT,
          status VARCHAR(20) DEFAULT 'Menunggu',
          user_id VARCHAR(50),
          user_name VARCHAR(100),
          user_phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS report_timelines (
          id INT AUTO_INCREMENT PRIMARY KEY,
          report_id VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          note TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS provinces (
          id VARCHAR(10) PRIMARY KEY,
          name VARCHAR(100) NOT NULL
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS regencies (
          id VARCHAR(10) PRIMARY KEY,
          province_id VARCHAR(10) NOT NULL,
          name VARCHAR(100) NOT NULL
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS districts (
          id VARCHAR(10) PRIMARY KEY,
          regency_id VARCHAR(10) NOT NULL,
          name VARCHAR(100) NOT NULL
        );
      `);
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS villages (
          id VARCHAR(10) PRIMARY KEY,
          district_id VARCHAR(10) NOT NULL,
          name VARCHAR(100) NOT NULL
        );
      `);

      // Seed default admin
      await mysqlPool.query(`
        INSERT IGNORE INTO admin (id, name, email, password) 
        VALUES ('ADM-001', 'Administrator Bina Marga', 'robbihably10@gmail.com', '${DEFAULT_HASHED_PASS}')
      `);

      // Seed Provinces
      await mysqlPool.query(`
        INSERT IGNORE INTO provinces (id, name) VALUES 
        ('32', 'Jawa Barat'), ('31', 'DKI Jakarta'), ('36', 'Banten')
      `);
      // Seed Regencies
      await mysqlPool.query(`
        INSERT IGNORE INTO regencies (id, province_id, name) VALUES 
        ('3271', '32', 'Kota Bogor'), ('3201', '32', 'Kabupaten Bogor'), 
        ('3276', '32', 'Kota Depok'), ('3275', '32', 'Kota Bekasi'), ('3174', '31', 'Jakarta Selatan')
      `);
      // Seed Districts
      await mysqlPool.query(`
        INSERT IGNORE INTO districts (id, regency_id, name) VALUES 
        ('327101', '3271', 'Bogor Tengah'), ('327102', '3271', 'Bogor Barat'), ('327103', '3271', 'Bogor Timur'),
        ('327104', '3271', 'Bogor Utara'), ('327105', '3271', 'Bogor Selatan'), ('327106', '3271', 'Tanah Sareal'),
        ('320101', '3201', 'Cibinong'), ('320102', '3201', 'Dramaga'), ('317401', '3174', 'Tebet')
      `);
      // Seed Villages
      await mysqlPool.query(`
        INSERT IGNORE INTO villages (id, district_id, name) VALUES 
        ('32710101', '327101', 'Paledang'), ('32710102', '327101', 'Babakan'), ('32710103', '327101', 'Cibogor'),
        ('32710104', '327101', 'Sempur'), ('32710105', '327101', 'Tegallega'), ('32710201', '327102', 'Menteng'),
        ('32710301', '327103', 'Baranangsiang'), ('32710401', '327104', 'Bantarjati'), ('32710501', '327105', 'Empang'),
        ('32710601', '327106', 'Kedung Badak'), ('32010101', '320101', 'Pakansari'), ('31740101', '317401', 'Tebet Barat')
      `);

      // Auto-seed initial users & reports if Cloud MySQL tables are empty
      try {
        const [uCheck] = await mysqlPool.query('SELECT count(*) as c FROM users');
        if (uCheck && uCheck[0] && uCheck[0].c === 0 && Array.isArray(MEMORY_USERS)) {
          for (const u of MEMORY_USERS) {
            await mysqlPool.query(
              "INSERT IGNORE INTO users (id, nik, name, email, password, phone, avatar, province, city, district, village, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [u.id, u.nik, u.name, u.email, u.password, u.phone || '', u.avatar || '', u.province || 'Jawa Barat', u.city || 'Kota Bogor', u.district || '', u.village || '', u.status || 'Aktif']
            );
          }
        }

        const [rCheck] = await mysqlPool.query('SELECT count(*) as c FROM reports');
        if (rCheck && rCheck[0] && rCheck[0].c === 0 && Array.isArray(MEMORY_REPORTS)) {
          for (const r of MEMORY_REPORTS) {
            await mysqlPool.query(
              "INSERT IGNORE INTO reports (id, title, category, severity, description, location_name, latitude, longitude, photo_url, status, user_name, user_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [r.id, r.title, r.category, r.severity, r.description, r.location_name, r.latitude, r.longitude, r.photo_url, r.status, r.user_name || 'Ahmad Subagja', r.user_phone || '081234567890']
            );
          }
        }
      } catch (seedErr) {
        console.warn("Notice seeding initial MySQL data:", seedErr.message);
      }
    } catch (e) {
      console.warn("Cloud MySQL table init notice:", e.message);
    }
  })();
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
    if (sqlUpper.includes("WHERE RESET_TOKEN = ?")) {
      const token = params[0];
      const match = activeUsers.filter(u => u.reset_token === token);
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

  if (sqlUpper.includes("UPDATE USERS SET NAME") || (sqlUpper.includes("UPDATE USERS") && sqlUpper.includes("AVATAR"))) {
    const targetId = params[params.length - 1];
    const user = MEMORY_USERS.find(u => u.id === targetId || u.email === targetId);
    if (user) {
      user.name = params[0] || user.name;
      user.nik = params[1] !== undefined ? params[1] : user.nik;
      user.phone = params[2] !== undefined ? params[2] : user.phone;
      user.province = params[3] || user.province;
      user.city = params[4] || user.city;
      user.district = params[5] || user.district;
      user.village = params[6] || user.village;
      user.avatar = params[7] || user.avatar;
    }
    return [{ affectedRows: 1 }];
  }

  if (sqlUpper.includes("UPDATE USERS SET RESET_TOKEN = ?")) {
    const token = params[0];
    const targetId = params[1] || params[2];
    const user = MEMORY_USERS.find(u => u.id === targetId || u.email === targetId);
    if (user) {
      user.reset_token = token;
    }
    return [{ affectedRows: 1 }];
  }

  if (sqlUpper.includes("UPDATE USERS SET PASSWORD = ?")) {
    const newPass = params[0];
    const targetId = params[1] || params[2];
    const user = MEMORY_USERS.find(u => u.id === targetId || u.email === targetId || u.reset_token === targetId);
    if (user) {
      user.password = newPass;
      user.reset_token = null;
    }
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

  if (sqlUpper.includes("UPDATE REPORTS")) {
    const reportId = params[params.length - 1];
    const report = MEMORY_REPORTS.find(r => r.id === reportId);
    if (report) {
      if (sqlUpper.includes("SET TITLE =") || sqlUpper.includes("TITLE =")) {
        report.title = params[0] || report.title;
        report.category = params[1] || report.category;
        report.severity = params[2] || report.severity;
        report.description = params[3] || report.description;
        report.location_name = params[4] || report.location_name || report.locationName;
        report.latitude = params[5] !== undefined ? params[5] : report.latitude;
        report.longitude = params[6] !== undefined ? params[6] : report.longitude;
        report.photo_url = params[7] || report.photo_url || report.photoUrl;
        report.locationName = report.location_name;
        report.photoUrl = report.photo_url;
      } else if (sqlUpper.includes("SET STATUS =")) {
        report.status = params[0];
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
  return !!mysqlPool || isVercel;
}

module.exports = {
  pool: { query },
  checkConnection,
  MEMORY_USERS,
  DELETED_USERS_SET
};
