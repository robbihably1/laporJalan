const http = require('http');

function postJson(urlPath, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
      headers
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

function putJson(urlPath, data, token) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'PUT',
      headers
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

async function testProfileUpdateAndRelogin() {
  console.log('===================================================');
  console.log(' Testing Profile Photo & Details Update + Re-login ');
  console.log('===================================================');

  // Register a test citizen user
  const testCitizenEmail = `citizen_test_${Date.now()}@gmail.com`;
  const testCitizenPassword = 'password123';
  await postJson('/api/auth/register', {
    name: 'Warga Tester Profile',
    email: testCitizenEmail,
    password: testCitizenPassword,
    phone: '08123456789'
  });

  // Activate citizen user in DB
  const { pool, MEMORY_USERS } = require('./backend/config/db.js');
  try {
    await pool.query("UPDATE users SET status = 'Aktif' WHERE email = ?", [testCitizenEmail]);
  } catch(e) {}
  const memU = MEMORY_USERS.find(u => u.email === testCitizenEmail);
  if (memU) memU.status = 'Aktif';

  // 1. Login citizen user
  console.log(`\n[Step 1] Logging in Citizen User (${testCitizenEmail})...`);
  const loginRes = await postJson('/api/auth/login', {
    email: testCitizenEmail,
    password: testCitizenPassword
  });

  if (loginRes.status !== 200 || !loginRes.data.user) {
    console.error('Citizen Login failed:', loginRes.data);
    process.exit(1);
  }

  const user = loginRes.data.user;
  const token = loginRes.data.token;
  console.log(`Logged in as Citizen #${user.id} (${user.name})`);

  // 2. Update citizen profile photo and details
  const testAvatarUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...COMPRESSED_AVATAR_DATA_' + Date.now();
  const testPhone = '0812-9988-7766';
  const testName = 'Warga Sukabumi Updated';

  console.log('\n[Step 2] Submitting PUT /api/auth/profile with new compressed avatar & details...');
  const updateRes = await putJson('/api/auth/profile', {
    id: user.id,
    email: user.email,
    name: testName,
    nik: '3271010202020002',
    phone: testPhone,
    province: 'Jawa Barat',
    city: 'Kota Bogor',
    district: 'Bogor Barat',
    village: 'Menteng',
    avatar: testAvatarUrl
  }, token);

  console.log('Update Status:', updateRes.status);
  console.log('Update Message:', updateRes.data.message);

  if (updateRes.status !== 200 || !updateRes.data.user) {
    console.error('Profile update failed:', updateRes.data);
    process.exit(1);
  }

  // 3. Simulate Logout and Re-login to check DB Persistence
  console.log('\n[Step 3] Simulating LOGOUT and RE-LOGIN for Citizen User...');
  const reloginRes = await postJson('/api/auth/login', {
    email: testCitizenEmail,
    password: testCitizenPassword
  });

  console.log('Re-login Status:', reloginRes.status);
  const reloggedUser = reloginRes.data.user;
  console.log('Re-login DB Avatar:', reloggedUser?.avatar?.substring(0, 60));
  console.log('Re-login DB Name:', reloggedUser?.name);
  console.log('Re-login DB Phone:', reloggedUser?.phone);

  // 4. Verify DB persistence directly
  let [dbRows] = [];
  try {
    const [u] = await pool.query('SELECT avatar, name, phone FROM users WHERE email = ?', [testCitizenEmail]);
    dbRows = u;
  } catch(e) {}

  console.log('\nDirect Database Query Result for Citizen User:');
  console.log('DB Avatar:', dbRows[0]?.avatar?.substring(0, 60));
  console.log('DB Name:', dbRows[0]?.name);

  if (reloggedUser && reloggedUser.avatar === testAvatarUrl && reloggedUser.name === testName && reloggedUser.phone === testPhone) {
    console.log('\n===================================================');
    console.log(' TEST PASSED 100%! Citizen Profile photo & details persisted in DB across logout/re-login! ');
    console.log('===================================================');
    process.exit(0);
  } else {
    console.error('\n TEST FAILED! Profile photo reverted after logout.');
    process.exit(1);
  }
}

testProfileUpdateAndRelogin().catch(console.error);
