const path = require('path');
const { pool } = require('./backend/config/db.js');

async function inspect() {
  const [admins] = await pool.query("SELECT count(*) as c FROM admin");
  const [users] = await pool.query("SELECT count(*) as c FROM users");
  const [reports] = await pool.query("SELECT count(*) as c FROM reports");
  const [timelines] = await pool.query("SELECT count(*) as c FROM report_timelines");
  
  console.log('--- Data in SQLite ---');
  console.log('Admin:', admins[0]?.c);
  console.log('Users:', users[0]?.c);
  console.log('Reports:', reports[0]?.c);
  console.log('Timelines:', timelines[0]?.c);
}

inspect().catch(console.error);
