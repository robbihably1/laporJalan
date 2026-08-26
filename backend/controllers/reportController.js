const { pool } = require('../config/db');
const PDFDocument = require('pdfkit-table');

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

// 5. Update Report Content/Details by Citizen User (Allowed ONLY IF status === 'Menunggu')
exports.updateReportDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, severity, description, locationName, latitude, longitude, photoUrl } = req.body;

    const now = new Date();
    const formattedTimestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    try {
      // 1. Check if report exists and status is 'Menunggu'
      let currentReport = null;
      const [existingRows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      if (existingRows && existingRows.length > 0) {
        currentReport = existingRows[0];
      }

      const { MEMORY_REPORTS } = require('../config/db');
      if (!currentReport && Array.isArray(MEMORY_REPORTS)) {
        currentReport = MEMORY_REPORTS.find(r => r.id === id);
      }

      if (!currentReport) {
        return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan!' });
      }

      if (currentReport.status !== 'Menunggu') {
        return res.status(400).json({
          success: false,
          message: `Laporan berstatus '${currentReport.status}' tidak dapat diperbarui lagi. Perubahan hanya diizinkan saat status masih 'Menunggu' verifikasi.`
        });
      }

      const updatedTitle = title || currentReport.title;
      const updatedCategory = category || currentReport.category;
      const updatedSeverity = severity || currentReport.severity;
      const updatedDescription = description || currentReport.description;
      const updatedLocationName = locationName || currentReport.location_name || currentReport.locationName;
      const updatedLat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : parseFloat(currentReport.latitude);
      const updatedLng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : parseFloat(currentReport.longitude);
      const updatedPhotoUrl = photoUrl || currentReport.photo_url || currentReport.photoUrl;

      // 2. Update report fields in DB
      await pool.query(
        `UPDATE reports 
         SET title = ?, category = ?, severity = ?, description = ?, location_name = ?, latitude = ?, longitude = ?, photo_url = ?
         WHERE id = ?`,
        [
          updatedTitle,
          updatedCategory,
          updatedSeverity,
          updatedDescription,
          updatedLocationName,
          updatedLat,
          updatedLng,
          updatedPhotoUrl,
          id
        ]
      );

      // Also update in-memory object if present
      if (Array.isArray(MEMORY_REPORTS)) {
        const memReport = MEMORY_REPORTS.find(r => r.id === id);
        if (memReport) {
          memReport.title = updatedTitle;
          memReport.category = updatedCategory;
          memReport.severity = updatedSeverity;
          memReport.description = updatedDescription;
          memReport.location_name = updatedLocationName;
          memReport.locationName = updatedLocationName;
          memReport.latitude = updatedLat;
          memReport.longitude = updatedLng;
          memReport.photo_url = updatedPhotoUrl;
          memReport.photoUrl = updatedPhotoUrl;
        }
      }

      // 3. Insert timeline record for edit activity
      try {
        await pool.query(
          `INSERT INTO report_timelines (report_id, status, note, timestamp)
           VALUES (?, ?, ?, ?)`,
          [id, 'Menunggu', 'Pengguna memperbarui rincian data pengajuan laporan.', formattedTimestamp]
        );
      } catch (e) {}

      // 4. Fetch updated report object with full timeline
      let updatedRows = [];
      let timelineRows = [];
      try {
        const [u] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
        updatedRows = u;
        const [t] = await pool.query('SELECT status, note, timestamp FROM report_timelines WHERE report_id = ? ORDER BY id ASC', [id]);
        timelineRows = t;
      } catch (e) {}

      const targetRow = (updatedRows && updatedRows.length > 0) ? updatedRows[0] : currentReport;

      const updatedReportObj = {
        id: targetRow.id,
        title: updatedTitle,
        category: updatedCategory,
        severity: updatedSeverity,
        description: updatedDescription,
        locationName: updatedLocationName,
        latitude: updatedLat,
        longitude: updatedLng,
        photoUrl: updatedPhotoUrl,
        status: targetRow.status || 'Menunggu',
        createdAt: targetRow.created_at || targetRow.createdAt,
        userName: targetRow.user_name || targetRow.userName || 'Masyarakat',
        userPhone: targetRow.user_phone || targetRow.userPhone || '-',
        userId: targetRow.user_id || targetRow.userId,
        timeline: (timelineRows && timelineRows.length > 0) ? timelineRows : (targetRow.timeline || [])
      };

      return res.json({
        success: true,
        message: 'Data laporan berhasil diperbarui!',
        data: updatedReportObj
      });

    } catch (dbErr) {
      console.warn("DB Update Report Details Fallback:", dbErr.message);
      const target = MOCK_REPORTS.find(r => r.id === id);
      if (target) {
        if (target.status !== 'Menunggu') {
          return res.status(400).json({
            success: false,
            message: `Laporan berstatus '${target.status}' sudah tidak dapat diperbarui lagi.`
          });
        }
        target.title = title || target.title;
        target.category = category || target.category;
        target.severity = severity || target.severity;
        target.description = description || target.description;
        target.locationName = locationName || target.locationName;
        if (latitude) target.latitude = latitude;
        if (longitude) target.longitude = longitude;
        if (photoUrl) target.photoUrl = photoUrl;
        target.timeline.push({ status: 'Menunggu', note: 'Pengguna memperbarui rincian data pengajuan laporan.', timestamp: formattedTimestamp });
        return res.json({ success: true, message: 'Data laporan berhasil diperbarui!', data: target });
      }
    }

    return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// 7. Export PDF Reports Controller Endpoint
exports.exportPDFReports = async (req, res) => {
  try {
    const { status, category, searchQuery, search, startDate, endDate } = req.query;
    const searchTerm = searchQuery || search;

    let rows = [];

    try {
      let query = 'SELECT * FROM reports';
      const params = [];
      const conditions = [];

      if (status && status !== 'Semua') {
        conditions.push('status = ?');
        params.push(status);
      }

      if (category && category !== 'Semua') {
        conditions.push('category = ?');
        params.push(category);
      }

      if (searchTerm) {
        conditions.push('(title LIKE ? OR location_name LIKE ? OR category LIKE ? OR id LIKE ? OR user_name LIKE ?)');
        const term = `%${searchTerm}%`;
        params.push(term, term, term, term, term);
      }

      if (startDate) {
        conditions.push('created_at >= ?');
        params.push(`${startDate} 00:00:00`);
      }

      if (endDate) {
        conditions.push('created_at <= ?');
        params.push(`${endDate} 23:59:59`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      const [queryResult] = await pool.query(query, params);
      rows = queryResult || [];
    } catch (dbErr) {
      console.warn("DB PDF Query Fallback:", dbErr.message);
      rows = [...MOCK_REPORTS];
    }

    // Export all matching rows without slicing limit
    const exportList = rows;

    // Initialize PDFDocument in A4 Landscape mode (Forcing pure White Auto Light Mode)
    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    const fileName = `Rekap_LaporJalan_${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    // Clean Document Header Title (Plain Text on White Page Background)
    doc
      .fontSize(16)
      .fillColor('#047857')
      .font('Helvetica-Bold')
      .text('REKAPITULASI LAPORAN PENGADUAN JALAN RUSAK', 30, 28);

    doc
      .fontSize(9)
      .fillColor('#475569')
      .font('Helvetica')
      .text(`Dinas Bina Marga - Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} | Total Data: ${exportList.length} Laporan`, 30, 48);

    // Draw thin emerald divider line below title
    doc
      .moveTo(30, 62)
      .lineTo(812, 62)
      .lineWidth(1.5)
      .strokeColor('#047857')
      .stroke();

    // Position Y after title header
    doc.y = 75;

    // Define PDF Table Structure with Dark Emerald Background & Pure White Text
    const table = {
      title: "",
      headers: [
        { label: "No", property: "no", width: 28, align: "center", headerColor: "#047857", headerOpacity: 1 },
        { label: "ID Laporan", property: "id", width: 115, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "Tanggal", property: "date", width: 70, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "Pelapor", property: "user", width: 95, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "No HP", property: "phone", width: 85, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "Kategori", property: "category", width: 100, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "Urgensi", property: "severity", width: 55, align: "center", headerColor: "#047857", headerOpacity: 1 },
        { label: "Lokasi Jalan", property: "location", width: 160, align: "left", headerColor: "#047857", headerOpacity: 1 },
        { label: "Status", property: "status", width: 65, align: "center", headerColor: "#047857", headerOpacity: 1 }
      ],
      datas: exportList.map((r, i) => ({
        no: String(i + 1),
        id: String(r.id || ''),
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : new Date(r.createdAt || Date.now()).toLocaleDateString('id-ID'),
        user: String(r.user_name || r.userName || 'Masyarakat'),
        phone: String(r.user_phone || r.userPhone || '-'),
        category: String(r.category || '-'),
        severity: String(r.severity || 'Sedang'),
        location: String(r.location_name || r.locationName || '-'),
        status: String(r.status || 'Menunggu')
      }))
    };

    // Render Table using pdfkit-table in AUTO LIGHT MODE
    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff"),
      prepareRow: (row, indexColumn, indexRow, rect, rowOptions) => {
        doc.font("Helvetica").fontSize(8).fillColor("#0f172a");
      },
      headerColor: "#047857",
      headerOpacity: 1,
      padding: 5,
      divider: {
        header: { disabled: false, width: 1, opacity: 1, color: '#047857' },
        horizontal: { disabled: false, width: 0.5, opacity: 0.5, color: '#cbd5e1' }
      }
    });

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Gagal membuat PDF: ' + err.message });
    }
  }
};

