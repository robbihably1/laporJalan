const { pool } = require('../config/db');

// 1. Get Provinces
exports.getProvinces = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM provinces ORDER BY name ASC');
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.warn("DB Provinces Error:", err.message);
    return res.json({ success: true, data: [{ id: '32', name: 'Jawa Barat' }] });
  }
};

// 2. Get Regencies (Kota / Kabupaten)
exports.getRegencies = async (req, res) => {
  try {
    const { province_id } = req.query;
    let query = 'SELECT * FROM regencies';
    const params = [];

    if (province_id) {
      query += ' WHERE province_id = ?';
      params.push(province_id);
    }
    query += ' ORDER BY name ASC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.warn("DB Regencies Error:", err.message);
    return res.json({
      success: true,
      data: [
        { id: '3271', province_id: '32', name: 'Kota Bogor' },
        { id: '3201', province_id: '32', name: 'Kabupaten Bogor' }
      ]
    });
  }
};

// 3. Get Districts (Kecamatan) by regency_id or regency_name
exports.getDistricts = async (req, res) => {
  try {
    const { regency_id, regency_name } = req.query;
    let query = 'SELECT d.* FROM districts d JOIN regencies r ON d.regency_id = r.id';
    const params = [];

    if (regency_id) {
      query += ' WHERE d.regency_id = ?';
      params.push(regency_id);
    } else if (regency_name) {
      query += ' WHERE r.name LIKE ? OR r.name LIKE ?';
      params.push(`%${regency_name}%`, `${regency_name}`);
    }

    query += ' ORDER BY d.name ASC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.warn("DB Districts Error:", err.message);
    return res.json({ success: true, data: [] });
  }
};

// 4. Get Villages (Kelurahan/Desa) by district_id or district_name
exports.getVillages = async (req, res) => {
  try {
    const { district_id, district_name } = req.query;
    let query = 'SELECT v.* FROM villages v JOIN districts d ON v.district_id = d.id';
    const params = [];

    if (district_id) {
      query += ' WHERE v.district_id = ?';
      params.push(district_id);
    } else if (district_name) {
      query += ' WHERE d.name LIKE ? OR d.name LIKE ?';
      params.push(`%${district_name}%`, `${district_name}`);
    }

    query += ' ORDER BY v.name ASC';

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.warn("DB Villages Error:", err.message);
    return res.json({ success: true, data: [] });
  }
};
