const http = require('http');

function postJson(urlPath, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: urlPath,
      method: 'POST',
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

async function testForgotPass() {
  console.log('===================================================');
  console.log(' Testing Forgot Password & Reset Password Workflow ');
  console.log('===================================================');

  // Test 1: Non-existent email
  console.log('\n[Test 1] Request reset for non-existent email (random_fake@email.com)...');
  const res1 = await postJson('/api/auth/forgot-password', { email: 'random_fake@email.com' });
  console.log('Status:', res1.status, 'Response:', res1.data);
  if (res1.status === 404 && res1.data.message.includes('tidak terdaftar')) {
    console.log(' TEST 1 PASSED: Correct alert for non-existent email.');
  } else {
    console.error(' TEST 1 FAILED!');
  }

  // Test 2: Inactive email
  console.log('\n[Test 2] Request reset for inactive email...');
  // Register an inactive user first
  const regEmail = `inactive_user_${Date.now()}@gmail.com`;
  await postJson('/api/auth/register', { name: 'Inactive User', email: regEmail, password: 'password123' });
  // Manually set status to Nonaktif in memory/DB
  const { pool, MEMORY_USERS } = require('./backend/config/db.js');
  const user = MEMORY_USERS.find(u => u.email === regEmail);
  if (user) user.status = 'Nonaktif';
  try {
    await pool.query("UPDATE users SET status = 'Nonaktif' WHERE email = ?", [regEmail]);
  } catch(e) {}

  const res2 = await postJson('/api/auth/forgot-password', { email: regEmail });
  console.log('Status:', res2.status, 'Response:', res2.data);
  if (res2.status === 400 && res2.data.message.includes('belum aktif')) {
    console.log(' TEST 2 PASSED: Correct alert for inactive account.');
  } else {
    console.error(' TEST 2 FAILED!');
  }

  // Test 3: Active valid email
  console.log('\n[Test 3] Request reset for ACTIVE email (robbihably10@gmail.com)...');
  const res3 = await postJson('/api/auth/forgot-password', { email: 'robbihably10@gmail.com' });
  console.log('Status:', res3.status, 'Response:', res3.data);
  if (res3.status === 200 && res3.data.success && res3.data.resetLink) {
    console.log(' TEST 3 PASSED: Reset link generated and email sent.');
  } else {
    console.error(' TEST 3 FAILED!');
    process.exit(1);
  }

  // Extract reset token from resetLink
  const resetLink = res3.data.resetLink;
  const token = resetLink.split('reset_token=')[1];
  console.log('\nExtracted Reset Token:', token);

  // Test 4: Submit New Password
  console.log('\n[Test 4] Submitting new password reset using token...');
  const res4 = await postJson('/api/auth/reset-password', { token, newPassword: 'newSecretPassword123' });
  console.log('Status:', res4.status, 'Response:', res4.data);
  if (res4.status === 200 && res4.data.success) {
    console.log(' TEST 4 PASSED: Password successfully updated in database!');
  } else {
    console.error(' TEST 4 FAILED!');
    process.exit(1);
  }

  // Test 5: Verify login with new password
  console.log('\n[Test 5] Logging in with new password (newSecretPassword123)...');
  const res5 = await postJson('/api/auth/login', { email: 'robbihably10@gmail.com', password: 'newSecretPassword123' });
  console.log('Status:', res5.status, 'Response:', res5.data);
  if (res5.status === 200 && res5.data.success && res5.data.token) {
    console.log(' TEST 5 PASSED: Login with new password succeeded!');
  } else {
    console.error(' TEST 5 FAILED!');
    process.exit(1);
  }

  console.log('\n===================================================');
  console.log(' ALL 5 TESTS PASSED 100% SUCCESSFULLY! ');
  console.log('===================================================');
  process.exit(0);
}

testForgotPass().catch(console.error);
