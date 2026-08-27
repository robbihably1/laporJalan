-- LaporJalan Master Schema & Seed for SQLite
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
    avatar TEXT,
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

-- Seed Initial Admin & Default User
INSERT OR IGNORE INTO admin (id, name, email, password, role)
VALUES ('ADM-001', 'Admin Bina Marga', 'robbihably10@gmail.com', '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h', 'admin');

INSERT OR IGNORE INTO users (id, nik, name, email, password, phone, avatar, city, province, district, village, status)
VALUES ('USR-0001', '3171012304950001', 'Ahmad Subagja', 'user@laporjalan.go.id', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', '081234567890', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop', 'Kota Bogor', 'Jawa Barat', 'Bogor Tengah', 'Paledang', 'Aktif');

-- Seed Initial Regions
INSERT OR IGNORE INTO provinces (id, name) VALUES ('32', 'Jawa Barat'), ('31', 'DKI Jakarta'), ('36', 'Banten');
INSERT OR IGNORE INTO regencies (id, province_id, name) VALUES 
('3271', '32', 'Kota Bogor'), ('3201', '32', 'Kabupaten Bogor'), ('3276', '32', 'Kota Depok'), ('3275', '32', 'Kota Bekasi'), ('3174', '31', 'Jakarta Selatan');

INSERT OR IGNORE INTO districts (id, regency_id, name) VALUES 
('327101', '3271', 'Bogor Tengah'), ('327102', '3271', 'Bogor Barat'), ('327103', '3271', 'Bogor Timur'),
('327104', '3271', 'Bogor Utara'), ('327105', '3271', 'Bogor Selatan'), ('327106', '3271', 'Tanah Sareal'),
('320101', '3201', 'Cibinong'), ('320102', '3201', 'Dramaga');

INSERT OR IGNORE INTO villages (id, district_id, name) VALUES 
('32710101', '327101', 'Paledang'), ('32710102', '327101', 'Babakan'), ('32710103', '327101', 'Cibogor'),
('32710104', '327101', 'Sempur'), ('32710105', '327101', 'Tegallega'), ('32710106', '327101', 'Panaragan'),
('32710107', '327101', 'Kebon Kelapa'), ('32710201', '327102', 'Menteng'), ('32710202', '327102', 'Bubulak');
