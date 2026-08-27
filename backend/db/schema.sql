-- LaporJalan Database Schema for MariaDB / MySQL
CREATE DATABASE IF NOT EXISTS lapor_jalan_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lapor_jalan_db;

-- 1. Table Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar VARCHAR(500),
    city VARCHAR(100),
    status ENUM('Aktif', 'Nonaktif') NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table Admin
CREATE TABLE IF NOT EXISTS admin (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    avatar VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Table Reports
CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    severity ENUM('Ringan', 'Sedang', 'Parah') NOT NULL DEFAULT 'Sedang',
    description TEXT NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    photo_url LONGTEXT NOT NULL,
    status ENUM('Menunggu', 'Diproses', 'Selesai', 'Ditolak') NOT NULL DEFAULT 'Menunggu',
    user_name VARCHAR(255),
    user_phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Table Report Timelines
CREATE TABLE IF NOT EXISTS report_timelines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    note TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Table Images (penyimpanan gambar persisten di database)
-- Gambar disimpan sebagai base64 agar tidak hilang saat deploy ulang di Vercel
CREATE TABLE IF NOT EXISTS images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    folder VARCHAR(50) NOT NULL DEFAULT 'lampiran',
    mime_type VARCHAR(100) NOT NULL DEFAULT 'image/jpeg',
    data LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SEED ADMIN & USER
INSERT INTO admin (id, name, email, password, role)
VALUES ('ADM-001', 'Admin Bina Marga', 'robbihably10@gmail.com', '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h', 'admin')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO users (id, nik, name, email, password, phone, avatar, city, status) 
VALUES (
    'USR-8821', 
    '3171021908950001', 
    'Budi Santoso', 
    'budi.santoso@example.com', 
    '$2a$10$vN0o5Y2P6hO6U3.qC3O6uO8f9Z5U5X5Y5Z5a5b5c5d5e5f5g5h', 
    '0812-3456-7890', 
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop', 
    'Jakarta Selatan',
    'Aktif'
) ON DUPLICATE KEY UPDATE name=VALUES(name);
