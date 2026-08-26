const path = require('path');
const { pool } = require('./backend/config/db.js');

async function inspect() {
  const [admins] = await pool.query("SELECT count(*) as c FROM admin");
  const [users] = await pool.query("SELECT count(*) as c FROM users");
  const [reports] = await pool.query("SELECT count(*) as c FROM reports");
  const [timelines] = await pool.query("SELECT count(*) as c FROM report_timelines");
  
  console.log('--- Data in SQLite ---');
  console.log('Admin count:', admins[0]?.c);
  console.log('Users count:', users[0]?.c);
  console.log('Reports count:', reports[0]?.c);
  console.log('Timelines count:', timelines[0]?.c);
  process.exit(0);
}

inspect().catch(console.error);
