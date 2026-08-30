const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_DIR = path.join(__dirname, 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Normalize URL and remove query strings
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // If path doesn't have an extension, try appending .html (e.g. /login -> /login.html)
  let filePath = path.join(FRONTEND_DIR, reqPath);
  if (!path.extname(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end('<!DOCTYPE html><html><head><title>404 Not Found</title></head><body style="font-family:sans-serif;background:#0d081f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h1>404</h1><p>Page Not Found</p><a href="/" style="color:#a78bfa;">Return to Home</a></div></body></html>');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isHtml = ext === '.html';

    // Production Security Headers
    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
    };

    // Cache Control Strategy
    if (isHtml) {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    } else {
      headers['Cache-Control'] = 'public, max-age=86400, stale-while-revalidate=604800';
    }

    // Gzip Compression Negotiation
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const canGzip = /\bgzip\b/.test(acceptEncoding) && (
      contentType.startsWith('text/') ||
      contentType.startsWith('application/javascript') ||
      contentType.startsWith('application/json') ||
      contentType === 'image/svg+xml'
    );

    if (canGzip) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      const raw = fs.createReadStream(filePath);
      const gzip = zlib.createGzip({ level: 6 });
      raw.pipe(gzip).pipe(res);
      raw.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
    } else {
      headers['Content-Length'] = stats.size;
      res.writeHead(200, headers);
      const raw = fs.createReadStream(filePath);
      raw.pipe(res);
      raw.on('error', () => { if (!res.headersSent) res.writeHead(500); res.end(); });
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🌐 DISISTA Production Frontend Server active on http://${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => process.exit(0));
});
