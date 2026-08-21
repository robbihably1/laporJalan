-- LaporJalan Database Schema for SQLite
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nik TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    city TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- SEED DATA
INSERT OR IGNORE INTO users (id, nik, name, email, password, phone, avatar, city) 
VALUES (
    'USR-8821', 
    '3171021908950001', 
    'Budi Santoso', 
    'budi.santoso@example.com', 
    '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h', 
    '0812-3456-7890', 
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop', 
    'Jakarta Selatan'
);

INSERT OR IGNORE INTO reports (id, user_id, title, category, severity, description, location_name, latitude, longitude, photo_url, status, user_name, user_phone, created_at)
VALUES 
(
    'REP-2026-0812-001',
    'USR-8821',
    'Lubang Dalam di Lampu Merah Jl. Sudirman',
    'Jalan Berlubang',
    'Parah',
    'Terdapat lubang berdiameter ~60cm dengan kedalaman 15cm persis di lajur kanan dekat perempatan lampu merah. Sangat membahayakan pengendara motor di malam hari.',
    'Jl. Jend. Sudirman No. 42, Jakarta Pusat',
    -6.20880000,
    106.82190000,
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop',
    'Diproses',
    'Budi Santoso',
    '0812-3456-7890',
    '2026-08-12 14:30:00'
),
(
    'REP-2026-0810-002',
    'USR-8821',
    'Jalan Ambles Akibat Luapan Drainase',
    'Jalan Ambles',
    'Sedang',
    'Aspal melesak ke bawah sepanjang 2 meter akibat erosi saluran air bawah tanah. Kendaraan roda empat terpaksa melambat.',
    'Jl. Gatot Subroto Kav 18, Tebet',
    -6.24150000,
    106.84360000,
    'https://images.unsplash.com/photo-1584463699966-1c88019b8849?q=80&w=800&auto=format&fit=crop',
    'Selesai',
    'Siti Rahma',
    '0857-1122-3344',
    '2026-08-10 08:15:00'
),
(
    'REP-2026-0814-003',
    'USR-8821',
    'Retak Rambut Panjang & Lampu Penerangan Mati',
    'Retak & Penerangan',
    'Ringan',
    'Retakan memanjang sekitar 10 meter di bahu jalan. Ditambah lagi lampu PJU di dekatnya tidak menyala.',
    'Jl. Raya Pasar Minggu KM 15',
    -6.27500000,
    106.84200000,
    'https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop',
    'Menunggu',
    'Budi Santoso',
    '0812-3456-7890',
    '2026-08-14 10:00:00'
);

INSERT OR IGNORE INTO report_timelines (id, report_id, status, note, timestamp)
VALUES
(1, 'REP-2026-0812-001', 'Menunggu', 'Laporan berhasil diterima oleh sistem.', '2026-08-12 14:30:00'),
(2, 'REP-2026-0812-001', 'Diproses', 'Tim Dinas Bina Marga telah melakukan verifikasi lokasi dan penjadwalan perbaikan.', '2026-08-13 09:15:00'),
(3, 'REP-2026-0810-002', 'Menunggu', 'Laporan masuk.', '2026-08-10 08:15:00'),
(4, 'REP-2026-0810-002', 'Diproses', 'Penambalan aspal darurat dan perbaikan drainase dijalankan.', '2026-08-10 13:00:00'),
(5, 'REP-2026-0810-002', 'Selesai', 'Pengaspalan ulang selesai dan jalan sudah aman dilalui.', '2026-08-11 16:45:00'),
(6, 'REP-2026-0814-003', 'Menunggu', 'Laporan baru dikirim, menunggu tinjauan verifikator.', '2026-08-14 10:00:00');
