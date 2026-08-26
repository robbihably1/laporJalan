const mysql = require('mysql2/promise');

const testHosts = [
  { host: 'proxy.rlwy.net', port: 3306 },
  { host: 'monorail.proxy.rlwy.net', port: 3306 },
  { host: 'roundhouse.proxy.rlwy.net', port: 3306 },
  { host: 'junction.proxy.rlwy.net', port: 3306 }
];

async function tryConnect() {
  for (const t of testHosts) {
    try {
      console.log(`Trying ${t.host}:${t.port}...`);
      const conn = await mysql.createConnection({
        host: t.host,
        port: t.port,
        user: 'root',
        password: 'tllagBoWimZUhMoizgHLceMbUwBTGhJb',
        database: 'railway',
        connectTimeout: 3000
      });
      console.log(` SUCCESS! Connected to ${t.host}:${t.port}`);
      await conn.end();
      return;
    } catch (e) {
      console.log(` Failed ${t.host}: ${e.message}`);
    }
  }
}

tryConnect();
