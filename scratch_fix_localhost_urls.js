const { pool } = require('./backend/config/db.js');

async function fixLocalhostPhotoUrls() {
  console.log('Connecting to Railway Cloud MySQL DB...');
  try {
    const [r1] = await pool.query("UPDATE reports SET photo_url = REPLACE(photo_url, 'http://localhost:5000', '') WHERE photo_url LIKE 'http://localhost:5000%'");
    const [r2] = await pool.query("UPDATE reports SET photo_url = REPLACE(photo_url, 'http://localhost:3000', '') WHERE photo_url LIKE 'http://localhost:3000%'");
    const [r3] = await pool.query("UPDATE reports SET photo_url = REPLACE(photo_url, 'http://localhost:5001', '') WHERE photo_url LIKE 'http://localhost:5001%'");
    const [r4] = await pool.query("UPDATE reports SET photo_url = REPLACE(photo_url, 'https://localhost:5000', '') WHERE photo_url LIKE 'https://localhost:5000%'");
    
    console.log('Localhost Photo URL Cleanup Finished!');
    console.log('Total DB rows updated:', (r1.affectedRows || 0) + (r2.affectedRows || 0) + (r3.affectedRows || 0) + (r4.affectedRows || 0));

    // Inspect sample photo URLs from DB
    const [samples] = await pool.query("SELECT id, photo_url FROM reports WHERE photo_url LIKE '/uploads%' LIMIT 5");
    console.log('Sample updated photo URLs in DB:');
    console.table(samples);

  } catch(err) {
    console.error('Error fixing localhost photo URLs:', err.message);
  } finally {
    process.exit(0);
  }
}

setTimeout(fixLocalhostPhotoUrls, 1000);
