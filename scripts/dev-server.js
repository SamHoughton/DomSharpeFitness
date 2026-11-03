// Local preview server that behaves like Netlify for the two things the plain
// static one can't: extension-less URLs (/personal-trainer-hitchin) and the
// image CDN (/.netlify/images?url=/img/x.jpg&w=300), which here just serves the
// original file. Usage: node scripts/dev-server.js [port]

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const port = parseInt(process.argv[2], 10) || 3001;

const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.xml': 'application/xml',
    '.txt': 'text/plain; charset=utf-8'
};

function resolve(urlPath) {
    const safe = path.normalize(decodeURIComponent(urlPath)).replace(/^([/\\])+/, '');
    const direct = path.join(root, safe);
    if (!direct.startsWith(root)) return null;
    if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
    if (fs.existsSync(direct + '.html')) return direct + '.html';
    if (fs.existsSync(path.join(direct, 'index.html'))) return path.join(direct, 'index.html');
    return null;
}

http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let target = url.pathname;

    if (target === '/.netlify/images') {
        target = url.searchParams.get('url') || '/';
    }

    const file = resolve(target === '/' ? '/index.html' : target);
    if (!file) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    res.writeHead(200, {
        'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log('Preview on http://localhost:' + port));
