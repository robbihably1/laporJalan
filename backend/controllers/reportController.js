const { pool } = require('../config/db');

// Sample mock data for fallback
let MOCK_REPORTS = [
  {
    id: "REP-2026-0812-001",
    title: "Lubang Dalam di Lampu Merah Jl. Sudirman",
    category: "Jalan Berlubang",
    severity: "Parah",
    description: "Terdapat lubang berdiameter ~60cm dengan kedalaman 15cm persis di lajur kanan dekat perempatan lampu merah. Sangat membahayakan pengendara motor di malam hari.",
    locationName: "Jl. Jend. Sudirman No. 42, Jakarta Pusat",
    latitude: -6.2088,
    longitude: 106.8219,
    photoUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop",
    status: "Diproses",
    createdAt: "2026-08-12T14:30:00Z",
    userName: "Budi Santoso",
    userPhone: "0812-3456-7890",
    timeline: [
      { status: "Menunggu", note: "Laporan berhasil diterima oleh sistem.", timestamp: "2026-08-12T14:30:00Z" },
      { status: "Diproses", note: "Tim Dinas Bina Marga telah melakukan verifikasi lokasi dan penjadwalan perbaikan.", timestamp: "2026-08-13T09:15:00Z" }
    ]
  },
  {
    id: "REP-2026-0810-002",
    title: "Jalan Ambles Akibat Luapan Drainase",
    category: "Jalan Ambles",
    severity: "Sedang",
    description: "Aspal melesak ke bawah sepanjang 2 meter akibat erosi saluran air bawah tanah. Kendaraan roda empat terpaksa melambat.",
    locationName: "Jl. Gatot Subroto Kav 18, Tebet",
    latitude: -6.2415,
    longitude: 106.8436,
    photoUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    status: "Selesai",
    createdAt: "2026-08-10T08:15:00Z",
    userName: "Siti Rahma",
    userPhone: "0857-1122-3344",
    timeline: [
      { status: "Menunggu", note: "Laporan masuk.", timestamp: "2026-08-10T08:15:00Z" },
      { status: "Diproses", note: "Penambalan aspal darurat dan perbaikan drainase dijalankan.", timestamp: "2026-08-10T13:00:00Z" },
      { status: "Selesai", note: "Pengaspalan ulang selesai dan jalan sudah aman dilalui.", timestamp: "2026-08-11T16:45:00Z" }
    ]
  },
  {
    id: "REP-2026-0814-003",
    title: "Retak Rambut Panjang & Lampu Penerangan Mati",
    category: "Retak & Penerangan",
    severity: "Ringan",
    description: "Retakan memanjang sekitar 10 meter di bahu jalan. Ditambah lagi lampu PJU di dekatnya tidak menyala.",
    locationName: "Jl. Raya Pasar Minggu KM 15",
    latitude: -6.2750,
    longitude: 106.8420,
    photoUrl: "https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=800&auto=format&fit=crop",
    status: "Menunggu",
    createdAt: "2026-08-14T10:00:00Z",
    userName: "Budi Santoso",
    userPhone: "0812-3456-7890",
    timeline: [
      { status: "Menunggu", note: "Laporan baru dikirim, menunggu tinjauan verifikator.", timestamp: "2026-08-14T10:00:00Z" }
    ]
  }
];

// Helper to format DB rows
function formatDbReport(row, timelines = []) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    severity: row.severity,
    description: row.description,
    locationName: row.location_name,
    latitude: parseFloat(row.latitude),
    longitude: parseFloat(row.longitude),
    photoUrl: row.photo_url,
    status: row.status,
    createdAt: row.created_at,
    userName: row.user_name || 'Masyarakat',
    userPhone: row.user_phone || '-',
    timeline: timelines.map(t => ({
      status: t.status,
      note: t.note,
      timestamp: t.timestamp
    }))
  };
}

// 1. Get All Reports
exports.getAllReports = async (req, res) => {
  try {
    const { status, search } = req.query;

    try {
      let query = 'SELECT * FROM reports';
      const params = [];
      const conditions = [];

      if (status && status !== 'Semua') {
        conditions.push('status = ?');
        params.push(status);
      }

      if (search) {
        conditions.push('(title LIKE ? OR location_name LIKE ? OR category LIKE ? OR id LIKE ?)');
        const term = `%${search}%`;
        params.push(term, term, term, term);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await pool.query(query, params);

      const [allTimelines] = await pool.query('SELECT * FROM report_timelines ORDER BY timestamp ASC');

      const formatted = rows.map(r => {
        const tList = allTimelines.filter(t => t.report_id === r.id);
        return formatDbReport(r, tList);
      });

      return res.json({
        success: true,
        count: formatted.length,
        data: formatted
      });
    } catch (dbErr) {
      console.warn("DB Query Fallback mode:", dbErr.message);

      let filtered = [...MOCK_REPORTS];
      if (status && status !== 'Semua') {
        filtered = filtered.filter(r => r.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(r => 
          r.title.toLowerCase().includes(q) ||
          r.locationName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
        );
      }

      return res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
  }
};

// 2. Get Report By ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      if (rows.length > 0) {
        const [timelines] = await pool.query('SELECT * FROM report_timelines WHERE report_id = ? ORDER BY timestamp ASC', [id]);
        return res.json({
          success: true,
          data: formatDbReport(rows[0], timelines)
        });
      }
    } catch (dbErr) {
      console.warn("DB GetById Fallback:", dbErr.message);
      const mock = MOCK_REPORTS.find(r => r.id === id);
      if (mock) {
        return res.json({ success: true, data: mock });
      }
    }

    return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server: ' + error.message });
  }
};

// 3. Create New Report
exports.createReport = async (req, res) => {
  try {
    const {
      title,
      category,
      severity,
      description,
      locationName,
      latitude,
      longitude,
      photoUrl,
      userId,
      userName,
      userPhone
    } = req.body;

    if (!description || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Keterangan, latitude, dan longitude wajib diisi!'
      });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const reportId = `REP-${dateStr.substring(0,4)}-${dateStr.substring(4,8)}-${randNum}`;

    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newReportObj = {
      id: reportId,
      userId: userId || null,
      title: title || `Laporan ${category || 'Jalan Rusak'}`,
      category: category || 'Jalan Berlubang',
      severity: severity || 'Sedang',
      description,
      locationName: locationName || 'Lokasi Terdeteksi GPS',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800&auto=format&fit=crop',
      status: 'Menunggu',
      createdAt: formattedTimestamp,
      userName: userName || 'Budi Santoso',
      userPhone: userPhone || '0812-3456-7890',
      timeline: [
        {
          status: 'Menunggu',
          note: 'Laporan baru saja terkirim ke sistem Dinas Bina Marga.',
          timestamp: formattedTimestamp
        }
      ]
    };

    try {
      await pool.query(
        `INSERT INTO reports (id, user_id, title, category, severity, description, location_name, latitude, longitude, photo_url, status, user_name, user_phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newReportObj.id,
          newReportObj.userId,
          newReportObj.title,
          newReportObj.category,
          newReportObj.severity,
          newReportObj.description,
          newReportObj.locationName,
          newReportObj.latitude,
          newReportObj.longitude,
          newReportObj.photoUrl,
          newReportObj.status,
          newReportObj.userName,
          newReportObj.userPhone,
          formattedTimestamp
        ]
      );

      // Insert initial timeline
      await pool.query(
        `INSERT INTO report_timelines (report_id, status, note, timestamp)
         VALUES (?, ?, ?, ?)`,
        [newReportObj.id, 'Menunggu', 'Laporan baru saja terkirim ke sistem Dinas Bina Marga.', formattedTimestamp]
      );

      return res.status(201).json({
        success: true,
        message: `Laporan #${reportId} berhasil dibuat!`,
        data: newReportObj
      });
    } catch (dbErr) {
      console.warn("DB Create Fallback:", dbErr.message);
      MOCK_REPORTS.unshift(newReportObj);
      return res.status(201).json({
        success: true,
        message: `Laporan #${reportId} berhasil dibuat (Simulasi)!`,
        data: newReportObj
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal membuat laporan: ' + error.message });
  }
};

// 4. Update Report Status & Add Timeline Note (STRICT NO-SAME-STATUS VALIDATION)
exports.updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status baru wajib diisi!' });
    }

    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const noteText = note || `Status laporan diperbarui menjadi '${status}'.`;

    try {
      // Check current status in DB first
      const [existingRows] = await pool.query('SELECT status FROM reports WHERE id = ?', [id]);
      if (existingRows && existingRows.length > 0) {
        const currentStatus = existingRows[0].status;
        if (currentStatus === status) {
          return res.status(400).json({
            success: false,
            message: `Status laporan #${id} saat ini sudah '${status}'. Silakan pilih status baru yang berbeda!`
          });
        }
      }

      await pool.query('UPDATE reports SET status = ? WHERE id = ?', [status, id]);
      await pool.query(
        'INSERT INTO report_timelines (report_id, status, note, timestamp) VALUES (?, ?, ?, ?)',
        [id, status, noteText, formattedTimestamp]
      );

      return res.json({
        success: true,
        message: `Status laporan #${id} berhasil diperbarui menjadi ${status}`
      });
    } catch (dbErr) {
      console.warn("DB Status Update Fallback:", dbErr.message);
      const target = MOCK_REPORTS.find(r => r.id === id);
      if (target) {
        if (target.status === status) {
          return res.status(400).json({
            success: false,
            message: `Status laporan saat ini sudah '${status}'. Silakan pilih status baru yang berbeda!`
          });
        }
        target.status = status;
        target.timeline.push({ status, note: noteText, timestamp: formattedTimestamp });
        return res.json({ success: true, message: `Status #${id} diperbarui!` });
      }
    }

    return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};
