const http = require('http');

function putJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch(e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    }).on('error', reject);
  });
}

async function testUpdateReport() {
  console.log('===================================================');
  console.log(' Testing Report Details Edit & DB Persistence ');
  console.log('===================================================');

  // 1. Get a report with status 'Menunggu'
  const listRes = await getJson('/api/reports?status=Menunggu');
  if (!listRes.data || !listRes.data.data || listRes.data.data.length === 0) {
    console.error('No report with status Menunggu found!');
    process.exit(1);
  }

  const targetReport = listRes.data.data[0];
  console.log(`Found target report to edit: #${targetReport.id} (${targetReport.title})`);

  const newTitle = `[UPDATED PERBAIKAN HASIL EDIT] ${targetReport.title}`;
  const newDescription = `Keterangan laporan telah diperbarui oleh pelapor warga pada ${new Date().toLocaleString()}`;

  // 2. Submit update via PUT /api/reports/:id
  console.log(`\nSubmitting PUT /api/reports/${targetReport.id}...`);
  const updateRes = await putJson(`/api/reports/${targetReport.id}`, {
    title: newTitle,
    category: targetReport.category,
    severity: 'Parah',
    description: newDescription,
    locationName: targetReport.locationName,
    latitude: targetReport.latitude,
    longitude: targetReport.longitude,
    photoUrl: targetReport.photoUrl
  });

  console.log('Update API Status:', updateRes.status);
  console.log('Update API Message:', updateRes.data.message);
  console.log('Returned Title:', updateRes.data.data?.title);

  // 3. Verify directly in Database
  const { pool } = require('./backend/config/db.js');
  const [dbRows] = await pool.query('SELECT * FROM reports WHERE id = ?', [targetReport.id]);
  console.log('\nDirect Database Query Result:');
  console.log('DB Title:', dbRows[0]?.title);
  console.log('DB Description:', dbRows[0]?.description);
  console.log('DB Severity:', dbRows[0]?.severity);

  if (dbRows[0] && dbRows[0].title === newTitle && dbRows[0].description === newDescription) {
    console.log('\n===================================================');
    console.log(' TEST PASSED 100%! Data successfully persisted in Database! ');
    console.log('===================================================');
    process.exit(0);
  } else {
    console.error('\n TEST FAILED! Data in DB was not updated correctly.');
    process.exit(1);
  }
}

testUpdateReport().catch(console.error);
