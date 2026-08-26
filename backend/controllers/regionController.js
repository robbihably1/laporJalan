const { pool } = require('../config/db');

const fallbackDistrictsMap = {
  'Kota Bogor': [
    { id: '327101', regency_id: '3271', name: 'Bogor Tengah' },
    { id: '327102', regency_id: '3271', name: 'Bogor Barat' },
    { id: '327103', regency_id: '3271', name: 'Bogor Timur' },
    { id: '327104', regency_id: '3271', name: 'Bogor Utara' },
    { id: '327105', regency_id: '3271', name: 'Bogor Selatan' },
    { id: '327106', regency_id: '3271', name: 'Tanah Sareal' }
  ],
  'Kabupaten Bogor': [
    { id: '320101', regency_id: '3201', name: 'Cibinong' },
    { id: '320102', regency_id: '3201', name: 'Dramaga' },
    { id: '320103', regency_id: '3201', name: 'Parung' },
    { id: '320104', regency_id: '3201', name: 'Gunung Putri' },
    { id: '320105', regency_id: '3201', name: 'Cileungsi' },
    { id: '320106', regency_id: '3201', name: 'Ciawi' }
  ],
  'Jakarta Selatan': [
    { id: '317401', regency_id: '3174', name: 'Tebet' },
    { id: '317402', regency_id: '3174', name: 'Kebayoran Baru' },
    { id: '317403', regency_id: '3174', name: 'Cilandak' }
  ],
  'Depok': [
    { id: '327601', regency_id: '3276', name: 'Beji' },
    { id: '327602', regency_id: '3276', name: 'Pancoran Mas' }
  ]
};

const fallbackVillagesMap = {
  'Bogor Tengah': [
    { id: '32710101', district_id: '327101', name: 'Paledang' },
    { id: '32710102', district_id: '327101', name: 'Babakan' },
    { id: '32710103', district_id: '327101', name: 'Cibogor' },
    { id: '32710104', district_id: '327101', name: 'Sempur' },
    { id: '32710105', district_id: '327101', name: 'Tegallega' },
    { id: '32710106', district_id: '327101', name: 'Panaragan' },
    { id: '32710107', district_id: '327101', name: 'Kebon Kelapa' }
  ],
  'Bogor Barat': [
    { id: '32710201', district_id: '327102', name: 'Menteng' },
    { id: '32710202', district_id: '327102', name: 'Bubulak' },
    { id: '32710203', district_id: '327102', name: 'Semplak' },
    { id: '32710204', district_id: '327102', name: 'Curug' },
    { id: '32710205', district_id: '327102', name: 'Loji' },
    { id: '32710206', district_id: '327102', name: 'Pasirkuda' },
    { id: '32710207', district_id: '327102', name: 'Balungbangjaya' }
  ],
  'Bogor Timur': [
    { id: '32710301', district_id: '327103', name: 'Baranangsiang' },
    { id: '32710302', district_id: '327103', name: 'Katulampa' },
    { id: '32710303', district_id: '327103', name: 'Tajur' },
    { id: '32710304', district_id: '327103', name: 'Sukasari' },
    { id: '32710305', district_id: '327103', name: 'Sindangrasa' }
  ],
  'Bogor Utara': [
    { id: '32710401', district_id: '327104', name: 'Bantarjati' },
    { id: '32710402', district_id: '327104', name: 'Cibuluh' },
    { id: '32710403', district_id: '327104', name: 'Kedunghalang' },
    { id: '32710404', district_id: '327104', name: 'Tanah Baru' },
    { id: '32710405', district_id: '327104', name: 'Tegalgundil' }
  ],
  'Bogor Selatan': [
    { id: '32710501', district_id: '327105', name: 'Empang' },
    { id: '32710502', district_id: '327105', name: 'Batutulis' },
    { id: '32710503', district_id: '327105', name: 'Bondongan' },
    { id: '32710504', district_id: '327105', name: 'Cikaret' },
    { id: '32710505', district_id: '327105', name: 'Mulyaharja' }
  ],
  'Tanah Sareal': [
    { id: '32710601', district_id: '327106', name: 'Kedung Badak' },
    { id: '32710602', district_id: '327106', name: 'Kebon Pedes' },
    { id: '32710603', district_id: '327106', name: 'Sukadamai' },
    { id: '32710604', district_id: '327106', name: 'Mekarwangi' },
    { id: '32710605', district_id: '327106', name: 'Kencana' }
  ],
  'Cibinong': [
    { id: '32010101', district_id: '320101', name: 'Pakansari' },
    { id: '32010102', district_id: '320101', name: 'Sukahati' },
    { id: '32010103', district_id: '320101', name: 'Tengah' },
    { id: '32010104', district_id: '320101', name: 'Ciriung' },
    { id: '32010105', district_id: '320101', name: 'Pabuaran' }
  ],
  'Dramaga': [
    { id: '32010201', district_id: '320102', name: 'Babakan' },
    { id: '32010202', district_id: '320102', name: 'Ciherang' },
    { id: '32010203', district_id: '320102', name: 'Dramaga' },
    { id: '32010204', district_id: '320102', name: 'Petir' }
  ],
  'Tebet': [
    { id: '31740101', district_id: '317401', name: 'Tebet Barat' },
    { id: '31740102', district_id: '317401', name: 'Tebet Timur' },
    { id: '31740103', district_id: '317401', name: 'Kebon Baru' },
    { id: '31740104', district_id: '317401', name: 'Bukit Duri' },
    { id: '31740105', district_id: '317401', name: 'Manggarai' }
  ]
};

// 1. Get Provinces
exports.getProvinces = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM provinces ORDER BY name ASC');
    if (rows && rows.length > 0) {
      return res.json({ success: true, data: rows });
    }
  } catch (err) {
    console.warn("DB Provinces Error:", err.message);
  }
  return res.json({
    success: true,
    data: [
      { id: '32', name: 'Jawa Barat' },
      { id: '31', name: 'DKI Jakarta' },
      { id: '36', name: 'Banten' }
    ]
  });
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
    if (rows && rows.length > 0) {
      return res.json({ success: true, data: rows });
    }
  } catch (err) {
    console.warn("DB Regencies Error:", err.message);
  }
  return res.json({
    success: true,
    data: [
      { id: '3271', province_id: '32', name: 'Kota Bogor' },
      { id: '3201', province_id: '32', name: 'Kabupaten Bogor' },
      { id: '3276', province_id: '32', name: 'Kota Depok' },
      { id: '3275', province_id: '32', name: 'Kota Bekasi' },
      { id: '3174', province_id: '31', name: 'Jakarta Selatan' }
    ]
  });
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
    if (rows && rows.length > 0) {
      return res.json({ success: true, data: rows });
    }
  } catch (err) {
    console.warn("DB Districts Error:", err.message);
  }

  // Fallback if DB query returns empty or errors
  const regKey = req.query.regency_name || 'Kota Bogor';
  const matchedList = fallbackDistrictsMap[regKey] || fallbackDistrictsMap['Kota Bogor'];
  return res.json({ success: true, data: matchedList });
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
    if (rows && rows.length > 0) {
      return res.json({ success: true, data: rows });
    }
  } catch (err) {
    console.warn("DB Villages Error:", err.message);
  }

  // Fallback if DB query returns empty or errors
  const distKey = req.query.district_name || 'Bogor Tengah';
  const matchedList = fallbackVillagesMap[distKey] || fallbackVillagesMap['Bogor Tengah'];
  return res.json({ success: true, data: matchedList });
};
