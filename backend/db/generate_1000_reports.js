const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const firstNames = [
  "Ahmad", "Budi", "Siti", "Dewi", "Rian", "Bambang", "Rina", "Eko", "Indah", "Hendra",
  "Agus", "Nurul", "Dedi", "Sri", "Fajar", "Lia", "Tri", "Maya", "Aris", "Yuni",
  "Rudi", "Ratna", "Andi", "Fitri", "Doni", "Nani", "Toni", "Wati", "Joko", "Rika",
  "Heri", "Tina", "Asep", "Lilis", "Cecep", "Eni", "Iwan", "Ani", "Diki", "Tuti"
];

const lastNames = [
  "Santoso", "Rahma", "Lestari", "Subagja", "Hidayat", "Wijaya", "Astuti", "Prasetyo", "Permata", "Gunawan",
  "Setiawan", "Hidayah", "Kurniawan", "Wahyuni", "Nugraha", "Rosdiana", "Sutrisno", "Kartika", "Munandar", "Saputra",
  "Kusuma", "Wibowo", "Syahputra", "Utami", "Firmansyah", "Handayani", "Wicaksono", "Suryani", "Pratama", "Hutapea"
];

const cities = [
  "Kota Bogor", "Kabupaten Bogor", "Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat",
  "Jakarta Timur", "Jakarta Utara", "Depok", "Bekasi", "Tangerang", "Tangerang Selatan"
];

const streetNames = [
  "Jl. Raya Pajajaran", "Jl. Jend. Sudirman", "Jl. Raya Tajur", "Jl. Ahmad Yani",
  "Jl. Abdullah Bin Nuh", "Jl. Raya Dramaga", "Jl. Ir. H. Juanda", "Jl. Pemuda",
  "Jl. Raya Bogor", "Jl. Sholeh Iskandar", "Jl. Raya Parung", "Jl. Margonda Raya",
  "Jl. Raya Serpong", "Jl. Raya Bekasi", "Jl. Raya Ciawi", "Jl. Raya Puncak",
  "Jl. Otto Iskandardinata", "Jl. Gatot Subroto", "Jl. HR Rasuna Said", "Jl. Raya Sawangan"
];

const photoUrls = [
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop"
];

const categories = ["Jalan Berlubang", "Jalan Ambles", "Retak & Penerangan", "Lainnya"];
const severities = ["Parah", "Sedang", "Ringan"];

// 1. Generate 100 Indonesian Users
const users = [];
for (let i = 1; i <= 100; i++) {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[(i * 3) % lastNames.length];
  const name = `${fn} ${ln}`;
  const id = `USR-${1000 + i}`;
  const nik = `32710${String(100000000 + i * 12345).slice(0, 11)}`;
  const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`;
  const phone = `08${12 + (i % 8)}-${String(1000 + i * 7).padStart(4, '0')}-${String(5000 + i * 3).padStart(4, '0')}`;
  const city = cities[i % cities.length];
  users.push({ id, nik, name, email, phone, city });
}

// 2. Generate 1,000 Indonesian Reports
const reports = [];
const startDate = new Date(2025, 0, 1).getTime();
const endDate = new Date(2026, 7, 26).getTime();
const timeRange = endDate - startDate;

for (let i = 1; i <= 1000; i++) {
  const u = users[i % users.length];
  
  const randTime = new Date(startDate + Math.random() * timeRange);
  const year = randTime.getFullYear();
  const monthStr = String(randTime.getMonth() + 1).padStart(2, '0');
  const dayStr = String(randTime.getDate()).padStart(2, '0');
  const hourStr = String(randTime.getHours()).padStart(2, '0');
  const minStr = String(randTime.getMinutes()).padStart(2, '0');
  const secStr = String(randTime.getSeconds()).padStart(2, '0');
  
  const dateFormattedSQL = `${year}-${monthStr}-${dayStr} ${hourStr}:${minStr}:${secStr}`;
  const dateFormattedISO = `${year}-${monthStr}-${dayStr}T${hourStr}:${minStr}:${secStr}Z`;

  const reportId = `REP-${year}-${monthStr}${dayStr}-${String(i).padStart(4, '0')}`;
  const cat = categories[i % categories.length];
  const sev = severities[i % severities.length];
  
  let st = "Menunggu";
  const stRand = i % 10;
  if (stRand < 4) st = "Selesai";
  else if (stRand < 7) st = "Diproses";
  else if (stRand < 9) st = "Menunggu";
  else st = "Ditolak";

  const stName = streetNames[i % streetNames.length];
  const houseNum = (i % 150) + 1;
  const city = cities[i % cities.length];
  const locationName = `${stName} No. ${houseNum}, ${city}`;
  
  const lat = -6.5500 - (i % 100) * 0.001;
  const lng = 106.7500 + (i % 100) * 0.001;
  const photo = photoUrls[i % photoUrls.length];

  let title = "";
  let description = "";

  if (cat === "Jalan Berlubang") {
    title = `Lubang ${sev === 'Parah' ? 'Besar & Dalam' : 'Berbahaya'} di ${stName}`;
    description = `Terdapat lubang berdiameter ~${(i % 50) + 20}cm dengan kedalaman ${(i % 15) + 5}cm di lajur jalan. Sangat membahayakan pengguna jalan terutama saat hujan/malam hari.`;
  } else if (cat === "Jalan Ambles") {
    title = `Jalan Ambles Akibat Retakan Drainase ${stName}`;
    description = `Aspal melesak ke bawah sepanjang ${(i % 4) + 1} meter akibat tergerus air bawah tanah. Kendaraan terpaksa memelankan laju.`;
  } else if (cat === "Retak & Penerangan") {
    title = `Retak Struktur Aspal & PJU Mati di ${stName}`;
    description = `Retakan memanjang di bahu jalan sejauh ${(i % 15) + 5} meter dan lampu penerangan jalan umum di sekitarnya padam.`;
  } else {
    title = `Kerusakan Bahu Jalan & Gorong-gorong Mampet di ${stName}`;
    description = `Bahu jalan terkikis banjir dan gorong-gorong dipenuhi endapan lumpur, air meluap ke perumahan warga.`;
  }

  const timelines = [
    { status: "Menunggu", note: "Laporan berhasil diterima oleh sistem.", timestamp: dateFormattedISO }
  ];
  if (st === "Diproses" || st === "Selesai") {
    const procTime = new Date(randTime.getTime() + 86400000).toISOString();
    timelines.push({ status: "Diproses", note: "Tim Dinas Bina Marga telah melakukan verifikasi lokasi dan penanganan.", timestamp: procTime });
  }
  if (st === "Selesai") {
    const compTime = new Date(randTime.getTime() + 172800000).toISOString();
    timelines.push({ status: "Selesai", note: "Pengaspalan ulang dan perbaikan telah selesai 100%.", timestamp: compTime });
  }
  if (st === "Ditolak") {
    timelines.push({ status: "Ditolak", note: "Laporan duplikat atau lokasi berada di luar kewenangan dinas.", timestamp: dateFormattedISO });
  }

  reports.push({
    id: reportId,
    userId: u.id,
    title,
    category: cat,
    severity: sev,
    description,
    locationName,
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lng.toFixed(6)),
    photoUrl: photo,
    image: photo,
    status: st,
    createdAt: dateFormattedISO,
    createdAtSQL: dateFormattedSQL,
    userName: u.name,
    userPhone: u.phone,
    timeline: timelines
  });
}

// Sort reports descending by date
reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// Write Frontend initialReports.js
const jsContent = `export const INITIAL_REPORTS = ${JSON.stringify(reports, null, 2)};\n`;
fs.writeFileSync(path.join(__dirname, '../../src/data/initialReports.js'), jsContent);

// Master Region Seed Data
const provincesData = [
  { id: '32', name: 'Jawa Barat' },
  { id: '31', name: 'DKI Jakarta' },
  { id: '36', name: 'Banten' }
];

const regenciesData = [
  { id: '3271', province_id: '32', name: 'Kota Bogor' },
  { id: '3201', province_id: '32', name: 'Kabupaten Bogor' },
  { id: '3276', province_id: '32', name: 'Kota Depok' },
  { id: '3275', province_id: '32', name: 'Kota Bekasi' },
  { id: '3174', province_id: '31', name: 'Jakarta Selatan' },
  { id: '3171', province_id: '31', name: 'Jakarta Pusat' },
  { id: '3173', province_id: '31', name: 'Jakarta Barat' },
  { id: '3175', province_id: '31', name: 'Jakarta Timur' },
  { id: '3172', province_id: '31', name: 'Jakarta Utara' },
  { id: '3671', province_id: '36', name: 'Kota Tangerang' },
  { id: '3674', province_id: '36', name: 'Kota Tangerang Selatan' }
];

const districtsData = [
  // Kota Bogor
  { id: '327101', regency_id: '3271', name: 'Bogor Tengah' },
  { id: '327102', regency_id: '3271', name: 'Bogor Barat' },
  { id: '327103', regency_id: '3271', name: 'Bogor Timur' },
  { id: '327104', regency_id: '3271', name: 'Bogor Utara' },
  { id: '327105', regency_id: '3271', name: 'Bogor Selatan' },
  { id: '327106', regency_id: '3271', name: 'Tanah Sareal' },
  // Kabupaten Bogor
  { id: '320101', regency_id: '3201', name: 'Cibinong' },
  { id: '320102', regency_id: '3201', name: 'Dramaga' },
  { id: '320103', regency_id: '3201', name: 'Parung' },
  { id: '320104', regency_id: '3201', name: 'Gunung Putri' },
  { id: '320105', regency_id: '3201', name: 'Cileungsi' },
  { id: '320106', regency_id: '3201', name: 'Ciawi' },
  // Jakarta Selatan
  { id: '317401', regency_id: '3174', name: 'Tebet' },
  { id: '317402', regency_id: '3174', name: 'Kebayoran Baru' },
  { id: '317403', regency_id: '3174', name: 'Cilandak' },
  // Depok
  { id: '327601', regency_id: '3276', name: 'Beji' },
  { id: '327602', regency_id: '3276', name: 'Pancoran Mas' }
];

const villagesData = [
  // Bogor Tengah
  { id: '32710101', district_id: '327101', name: 'Paledang' },
  { id: '32710102', district_id: '327101', name: 'Babakan' },
  { id: '32710103', district_id: '327101', name: 'Cibogor' },
  { id: '32710104', district_id: '327101', name: 'Sempur' },
  { id: '32710105', district_id: '327101', name: 'Tegallega' },
  { id: '32710106', district_id: '327101', name: 'Panaragan' },
  { id: '32710107', district_id: '327101', name: 'Kebon Kelapa' },
  // Bogor Barat
  { id: '32710201', district_id: '327102', name: 'Menteng' },
  { id: '32710202', district_id: '327102', name: 'Bubulak' },
  { id: '32710203', district_id: '327102', name: 'Semplak' },
  { id: '32710204', district_id: '327102', name: 'Curug' },
  { id: '32710205', district_id: '327102', name: 'Loji' },
  { id: '32710206', district_id: '327102', name: 'Pasirkuda' },
  { id: '32710207', district_id: '327102', name: 'Balungbangjaya' },
  // Bogor Timur
  { id: '32710301', district_id: '327103', name: 'Baranangsiang' },
  { id: '32710302', district_id: '327103', name: 'Katulampa' },
  { id: '32710303', district_id: '327103', name: 'Tajur' },
  { id: '32710304', district_id: '327103', name: 'Sukasari' },
  { id: '32710305', district_id: '327103', name: 'Sindangrasa' },
  // Bogor Utara
  { id: '32710401', district_id: '327104', name: 'Bantarjati' },
  { id: '32710402', district_id: '327104', name: 'Cibuluh' },
  { id: '32710403', district_id: '327104', name: 'Kedunghalang' },
  { id: '32710404', district_id: '327104', name: 'Tanah Baru' },
  { id: '32710405', district_id: '327104', name: 'Tegalgundil' },
  // Bogor Selatan
  { id: '32710501', district_id: '327105', name: 'Empang' },
  { id: '32710502', district_id: '327105', name: 'Batutulis' },
  { id: '32710503', district_id: '327105', name: 'Bondongan' },
  { id: '32710504', district_id: '327105', name: 'Cikaret' },
  { id: '32710505', district_id: '327105', name: 'Mulyaharja' },
  // Tanah Sareal
  { id: '32710601', district_id: '327106', name: 'Kedung Badak' },
  { id: '32710602', district_id: '327106', name: 'Kebon Pedes' },
  { id: '32710603', district_id: '327106', name: 'Sukadamai' },
  { id: '32710604', district_id: '327106', name: 'Mekarwangi' },
  { id: '32710605', district_id: '327106', name: 'Kencana' },
  // Cibinong
  { id: '32010101', district_id: '320101', name: 'Pakansari' },
  { id: '32010102', district_id: '320101', name: 'Sukahati' },
  { id: '32010103', district_id: '320101', name: 'Tengah' },
  { id: '32010104', district_id: '320101', name: 'Ciriung' },
  { id: '32010105', district_id: '320101', name: 'Pabuaran' },
  // Dramaga
  { id: '32010201', district_id: '320102', name: 'Babakan' },
  { id: '32010202', district_id: '320102', name: 'Ciherang' },
  { id: '32010203', district_id: '320102', name: 'Dramaga' },
  { id: '32010204', district_id: '320102', name: 'Petir' },
  // Tebet
  { id: '31740101', district_id: '317401', name: 'Tebet Barat' },
  { id: '31740102', district_id: '317401', name: 'Tebet Timur' },
  { id: '31740103', district_id: '317401', name: 'Kebon Baru' },
  { id: '31740104', district_id: '317401', name: 'Bukit Duri' },
  { id: '31740105', district_id: '317401', name: 'Manggarai' }
];

// Update SQLite Database
const dbPath = path.join(__dirname, '../db/lapor_jalan.sqlite');
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
  } catch (e) {}
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const fullSchema = `
DROP TABLE IF EXISTS report_timelines;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS villages;
DROP TABLE IF EXISTS districts;
DROP TABLE IF EXISTS regencies;
DROP TABLE IF EXISTS provinces;

CREATE TABLE IF NOT EXISTS provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regencies (
    id TEXT PRIMARY KEY,
    province_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    regency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (regency_id) REFERENCES regencies(id)
);

CREATE TABLE IF NOT EXISTS villages (
    id TEXT PRIMARY KEY,
    district_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nik TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    city TEXT,
    province TEXT,
    district TEXT,
    village TEXT,
    status TEXT NOT NULL DEFAULT 'Aktif',
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'Sedang',
    description TEXT NOT NULL,
    location_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    photo_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Menunggu',
    user_name TEXT,
    user_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS report_timelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
`;

db.exec(fullSchema);

// Insert Regions
const insProv = db.prepare("INSERT OR IGNORE INTO provinces (id, name) VALUES (?, ?)");
for (const p of provincesData) insProv.run(p.id, p.name);

const insReg = db.prepare("INSERT OR IGNORE INTO regencies (id, province_id, name) VALUES (?, ?, ?)");
for (const r of regenciesData) insReg.run(r.id, r.province_id, r.name);

const insDist = db.prepare("INSERT OR IGNORE INTO districts (id, regency_id, name) VALUES (?, ?, ?)");
for (const d of districtsData) insDist.run(d.id, d.regency_id, d.name);

const insVil = db.prepare("INSERT OR IGNORE INTO villages (id, district_id, name) VALUES (?, ?, ?)");
for (const v of villagesData) insVil.run(v.id, v.district_id, v.name);

// Insert Admin & Users
const insAdmin = db.prepare("INSERT OR IGNORE INTO admin (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)");
insAdmin.run('ADM-001', 'Admin Bina Marga', 'admin@laporjalan.go.id', '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h', 'admin');

const insUser = db.prepare("INSERT OR IGNORE INTO users (id, nik, name, email, password, phone, avatar, city, province, district, village, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const defaultPassHash = '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h';
const avatarUrl = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop';

for (const u of users) {
  insUser.run(u.id, u.nik, u.name, u.email, defaultPassHash, u.phone, avatarUrl, u.city, 'Jawa Barat', 'Bogor Tengah', 'Paledang', 'Aktif');
}

// Insert Reports & Timelines
const insReport = db.prepare("INSERT INTO reports (id, user_id, title, category, severity, description, location_name, latitude, longitude, photo_url, status, user_name, user_phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
const insTimeline = db.prepare("INSERT INTO report_timelines (report_id, status, note, timestamp) VALUES (?, ?, ?, ?)");

const insertAll = db.transaction(() => {
  for (const r of reports) {
    insReport.run(
      r.id, r.userId, r.title, r.category, r.severity, r.description,
      r.locationName, r.latitude, r.longitude, r.photoUrl, r.status,
      r.userName, r.userPhone, r.createdAtSQL
    );
    for (const t of r.timeline) {
      insTimeline.run(r.id, t.status, t.note, t.timestamp);
    }
  }
});

insertAll();

console.log(" Successfully created provinces, regencies, districts, villages, 100 users, and 1,000 reports into SQLite!");
