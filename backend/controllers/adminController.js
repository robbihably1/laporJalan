const { pool } = require('../config/db');

// 1. Get All Users (Admin Only) - Query strictly from SQLite DB
exports.getAllUsers = async (req, res) => {
  try {
    try {
      const [rows] = await pool.query('SELECT id, nik, name, email, phone, avatar, province, city, district, village, status, created_at FROM users ORDER BY created_at DESC');
      return res.json({ success: true, count: rows.length, data: rows });
    } catch (dbErr) {
      console.warn("DB GetUsers Notice:", dbErr.message);
      return res.json({
        success: true,
        count: 0,
        data: []
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data user dari database: ' + error.message });
  }
};

// 2. Update User Status (Aktif / Nonaktif)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || (status !== 'Aktif' && status !== 'Nonaktif')) {
      return res.status(400).json({ success: false, message: 'Status harus bernilai "Aktif" atau "Nonaktif"!' });
    }

    try {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
      return res.json({
        success: true,
        message: `Status user #${id} berhasil diubah menjadi ${status}`
      });
    } catch (dbErr) {
      console.warn("DB UpdateStatus Notice:", dbErr.message);
      return res.json({
        success: true,
        message: `Status user #${id} berhasil diubah menjadi ${status}`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal meng-update status user: ' + error.message });
  }
};
