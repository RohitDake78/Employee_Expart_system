const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Default root to login page
  if (urlPath === '/') urlPath = '/pages/login.html';

  // Auto-add .html if no extension
  if (!path.extname(urlPath)) urlPath = urlPath + '.html';

  const filePath = path.join(ROOT, urlPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log('NOT FOUND:', filePath);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h2>404 - File Not Found</h2><p>' + filePath + '</p>');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('Frontend running at: http://localhost:' + PORT + '/pages/login.html');
  console.log('Serving files from:  ' + ROOT);
  console.log('Press Ctrl+C to stop.');
  console.log('');
});