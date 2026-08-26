const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');

const sqliteDbPath = path.join(__dirname, '../db/lapor_jalan.sqlite');

async function migrate() {
  console.log('===================================================');
  console.log(' Starting Fast Automated Migration: SQLite ➔ Railway MySQL');
  console.log('===================================================');

  const host = process.env.DB_HOST || process.env.MYSQLHOST || process.env.RAILWAY_TCP_PROXY_DOMAIN || 'tokaido.proxy.rlwy.net';
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || 'tllagBoWimZUhMoizgHLceMbUwBTGhJb';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'railway';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT || process.env.RAILWAY_TCP_PROXY_PORT || '30770');
  const rawUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || 'mysql://root:tllagBoWimZUhMoizgHLceMbUwBTGhJb@tokaido.proxy.rlwy.net:30770/railway';

  let pool = null;

  if (rawUrl && rawUrl.startsWith('mysql')) {
    const dbUrl = new URL(rawUrl);
    pool = mysql.createPool({
      host: dbUrl.hostname,
      user: dbUrl.username || 'root',
      password: dbUrl.password,
      database: dbUrl.pathname.replace('/', '') || 'railway',
      port: parseInt(dbUrl.port || '30770'),
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
    console.log(` Target Cloud Database: ${dbUrl.hostname}:${dbUrl.port || 30770}`);
  } else {
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
    console.log(` Target Cloud Database: ${host}:${port}`);
  }

  // Helper to query SQLite
  const sqliteDb = new sqlite3.Database(sqliteDbPath);
  const querySqlite = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    // 1. Create Tables
    console.log('\n[1/6] Ensuring Cloud MySQL schema & regional master tables exist...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS report_timelines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        note TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id VARCHAR(10) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS regencies (
        id VARCHAR(10) PRIMARY KEY,
        province_id VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id VARCHAR(10) PRIMARY KEY,
        regency_id VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL
      );
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS villages (
        id VARCHAR(10) PRIMARY KEY,
        district_id VARCHAR(10) NOT NULL,
        name VARCHAR(100) NOT NULL
      );
    `);

    // 2. Migrate Admin
    console.log('[2/6] Migrating Admin Accounts...');
    const adminRows = await querySqlite("SELECT * FROM admin");
    for (const a of adminRows) {
      await pool.query(
        "INSERT IGNORE INTO admin (id, name, email, password, created_at) VALUES (?, ?, ?, ?, ?)",
        [a.id, a.name, a.email, a.password, a.created_at || new Date()]
      );
    }
    console.log(` Migrated ${adminRows.length} Admin account(s).`);

    // 3. Migrate Users
    console.log('[3/6] Migrating Users...');
    const userRows = await querySqlite("SELECT * FROM users");
    const userValues = userRows.map(u => [
      u.id, u.nik, u.name, u.email, u.password, u.phone, u.avatar, u.province, u.city, u.district, u.village, u.status || 'Aktif', u.verification_token, u.created_at || new Date()
    ]);
    if (userValues.length > 0) {
      await pool.query(
        "INSERT IGNORE INTO users (id, nik, name, email, password, phone, avatar, province, city, district, village, status, verification_token, created_at) VALUES ?",
        [userValues]
      );
    }
    console.log(` Migrated ${userRows.length} User(s).`);

    // 4. Migrate Reports (Batching)
    console.log('[4/6] Migrating Reports (Batch Mode)...');
    const reportRows = await querySqlite("SELECT * FROM reports");
    const chunkSize = 100;
    for (let i = 0; i < reportRows.length; i += chunkSize) {
      const chunk = reportRows.slice(i, i + chunkSize);
      const reportValues = chunk.map(r => [
        r.id, r.title, r.category, r.severity, r.description, r.location_name, r.latitude, r.longitude, r.photo_url, r.status, r.user_id, r.user_name, r.user_phone, r.created_at || new Date()
      ]);
      await pool.query(
        "INSERT IGNORE INTO reports (id, title, category, severity, description, location_name, latitude, longitude, photo_url, status, user_id, user_name, user_phone, created_at) VALUES ?",
        [reportValues]
      );
    }
    console.log(` Migrated ${reportRows.length} Report(s).`);

    // 5. Migrate Report Timelines (Batching)
    console.log('[5/6] Migrating Timelines (Batch Mode)...');
    const timelineRows = await querySqlite("SELECT * FROM report_timelines");
    for (let i = 0; i < timelineRows.length; i += chunkSize) {
      const chunk = timelineRows.slice(i, i + chunkSize);
      const timelineValues = chunk.map(t => [
        t.report_id, t.status, t.note, t.timestamp || new Date()
      ]);
      await pool.query(
        "INSERT IGNORE INTO report_timelines (report_id, status, note, timestamp) VALUES ?",
        [timelineValues]
      );
    }
    console.log(` Migrated ${timelineRows.length} Timeline record(s).`);

    // 6. Seed Regional Master Data (Provinsi, Kota, Kecamatan, Kelurahan)
    console.log('[6/6] Seeding Regional Master Data (Provinsi, Kota, Kecamatan, Kelurahan)...');
    await pool.query(`
      INSERT IGNORE INTO provinces (id, name) VALUES 
      ('32', 'Jawa Barat'), ('31', 'DKI Jakarta'), ('36', 'Banten')
    `);
    await pool.query(`
      INSERT IGNORE INTO regencies (id, province_id, name) VALUES 
      ('3271', '32', 'Kota Bogor'), ('3201', '32', 'Kabupaten Bogor'), 
      ('3276', '32', 'Kota Depok'), ('3275', '32', 'Kota Bekasi'), ('3174', '31', 'Jakarta Selatan')
    `);
    await pool.query(`
      INSERT IGNORE INTO districts (id, regency_id, name) VALUES 
      ('327101', '3271', 'Bogor Tengah'), ('327102', '3271', 'Bogor Barat'), ('327103', '3271', 'Bogor Timur'),
      ('327104', '3271', 'Bogor Utara'), ('327105', '3271', 'Bogor Selatan'), ('327106', '3271', 'Tanah Sareal'),
      ('320101', '3201', 'Cibinong'), ('320102', '3201', 'Dramaga'), ('317401', '3174', 'Tebet')
    `);
    await pool.query(`
      INSERT IGNORE INTO villages (id, district_id, name) VALUES 
      ('32710101', '327101', 'Paledang'), ('32710102', '327101', 'Babakan'), ('32710103', '327101', 'Cibogor'),
      ('32710104', '327101', 'Sempur'), ('32710105', '327101', 'Tegallega'), ('32710201', '327102', 'Menteng'),
      ('32710301', '327103', 'Baranangsiang'), ('32710401', '327104', 'Bantarjati'), ('32710501', '327105', 'Empang'),
      ('32710601', '327106', 'Kedung Badak'), ('32010101', '320101', 'Pakansari'), ('31740101', '317401', 'Tebet Barat')
    `);
    console.log(' Regional Master Data Seeded.');

    console.log('\n===================================================');
    console.log(' All Data (Users, Reports, Timelines, Regions) Migrated Successfully!');
    console.log('===================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
