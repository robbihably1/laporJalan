const { pool, MEMORY_USERS, DELETED_USERS_SET } = require('../config/db');

// 1. Get All Users (Admin Only) - Merges SQLite DB with Memory Cache & filters out deleted users
exports.getAllUsers = async (req, res) => {
  try {
    let dbUsers = [];
    try {
      const [rows] = await pool.query('SELECT id, nik, name, email, phone, avatar, province, city, district, village, status, created_at FROM users ORDER BY created_at DESC');
      if (rows && Array.isArray(rows)) {
        dbUsers = rows;
      }
    } catch (dbErr) {
      console.warn("DB GetUsers Notice:", dbErr.message);
    }

    // Merge SQLite DB users with MEMORY_USERS
    const mergedMap = new Map();
    dbUsers.forEach(u => {
      const key = u.email || u.id;
      if (key) mergedMap.set(key, u);
    });

    if (Array.isArray(MEMORY_USERS)) {
      MEMORY_USERS.forEach(u => {
        const key = u.email || u.id;
        if (key && !mergedMap.has(key)) {
          mergedMap.set(key, u);
        } else if (key && mergedMap.has(key)) {
          // Sync status from memory if memory has active status
          const existing = mergedMap.get(key);
          if (u.status === 'Aktif') existing.status = 'Aktif';
        }
      });
    }

    // Filter out deleted users
    const finalUsers = Array.from(mergedMap.values()).filter(u => {
      if (!u) return false;
      const isDeleted = (DELETED_USERS_SET && (DELETED_USERS_SET.has(u.id) || DELETED_USERS_SET.has(u.email) || DELETED_USERS_SET.has(u.nik)));
      return !isDeleted;
    });

    return res.json({ success: true, count: finalUsers.length, data: finalUsers });
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

    // Update memory cache
    if (Array.isArray(MEMORY_USERS)) {
      const memUser = MEMORY_USERS.find(u => u.id === id || u.email === id);
      if (memUser) {
        memUser.status = status;
        if (status === 'Aktif') memUser.verification_token = null;
      }
    }

    try {
      await pool.query('UPDATE users SET status = ?, verification_token = NULL WHERE id = ? OR email = ?', [status, id, id]);
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

// 3. Delete User (Admin Only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: 'ID User wajib disertakan!' });
    }

    // Record deletion in global set
    if (DELETED_USERS_SET) {
      DELETED_USERS_SET.add(id);
    }

    // Remove from memory users array
    if (Array.isArray(MEMORY_USERS)) {
      const targetUser = MEMORY_USERS.find(u => u.id === id || u.email === id);
      if (targetUser) {
        if (targetUser.email) DELETED_USERS_SET.add(targetUser.email);
        if (targetUser.id) DELETED_USERS_SET.add(targetUser.id);
        if (targetUser.nik) DELETED_USERS_SET.add(targetUser.nik);
      }
    }

    try {
      // 1. Unlink associated reports first so foreign keys don't block
      try {
        await pool.query('UPDATE reports SET user_id = NULL WHERE user_id = ? OR user_name = ?', [id, id]);
      } catch (repErr) {
        console.warn("Notice unlinking reports for deleted user:", repErr.message);
      }

      // 2. Delete user row from database
      await pool.query('DELETE FROM users WHERE id = ? OR email = ? OR nik = ?', [id, id, id]);

      return res.json({
        success: true,
        message: `Pengguna #${id} berhasil dihapus secara permanen!`
      });
    } catch (dbErr) {
      console.warn("DB DeleteUser Notice:", dbErr.message);
      return res.json({
        success: true,
        message: `Pengguna #${id} berhasil dihapus.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal menghapus akun pengguna: ' + error.message });
  }
};
