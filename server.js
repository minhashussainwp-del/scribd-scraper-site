// Local dev static server (dependency-free).
// NOTE: Vercel's build requires a root entrypoint file (server.js / index.js / app.js)
// to exist, otherwise the deployment fails with "No entrypoint found".
// Vercel does NOT run this file in production — it serves public/ statically
// and api/ as serverless functions. This file is only for local `node server.js`.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, 'public');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    if (p === '/sitemap.xml' || p === '/robots.txt' || p.startsWith('/api/') || p.startsWith('/blog/')) {
      res.writeHead(501, { 'Content-Type': 'text/plain' });
      return res.end('API routes need `npx vercel dev`. This static dev server only serves public/.');
    }
    const f = path.join(PUBLIC, decodeURIComponent(p));
    if (!f.startsWith(PUBLIC)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(f, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not found');
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  })
  .listen(3000, () => console.log('Dev server: http://localhost:3000  (API routes need `npx vercel dev`)'));
