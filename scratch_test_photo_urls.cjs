const http = require('http');

http.get('http://localhost:5000/api/reports', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      const reports = json.data || json;
      console.log('Total reports fetched:', reports.length);
      
      const localhostUrls = reports.filter(r => r.photoUrl && r.photoUrl.includes('localhost:5000'));
      console.log('Reports with http://localhost:5000 remaining:', localhostUrls.length);

      const uploadsUrls = reports.filter(r => r.photoUrl && r.photoUrl.startsWith('/uploads'));
      console.log('Reports with relative /uploads/ URLs:', uploadsUrls.length);
      
      if (uploadsUrls.length > 0) {
        console.log('Sample relative photoUrl:', uploadsUrls[0].photoUrl);
      }

      if (localhostUrls.length === 0) {
        console.log('PASSED! 0 hardcoded localhost photo URLs found in API response.');
      } else {
        console.error('FAILED! Found hardcoded localhost URLs.');
      }
    } catch(e) {
      console.error('Error parsing JSON:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('HTTP Request Error:', err.message);
});
