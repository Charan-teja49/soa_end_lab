const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Rewrite rule: strip the public /accounts prefix and add /internal/accounts.
// /accounts/1?view=full -> /internal/accounts/1?view=full
function rewritePath(url) {
  if (url.pathname !== '/accounts' && !url.pathname.startsWith('/accounts/')) return null;
  return '/internal/accounts' + url.pathname.slice('/accounts'.length) + url.search;
}

function startGateway(port = 8080, accountPort = 8081) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    }
    const targetPath = rewritePath(url);
    if (targetPath === null) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Use the public /accounts endpoint' }));
    }
    console.log(`[gateway] ${req.method} ${req.url} -> ${targetPath}`);
    const upstream = http.request({
      hostname: '127.0.0.1', port: accountPort, method: req.method,
      path: targetPath, headers: { ...req.headers, host: `127.0.0.1:${accountPort}` }
    }, targetResponse => {
      res.writeHead(targetResponse.statusCode, {
        ...targetResponse.headers,
        'X-Gateway-Original-Path': req.url,
        'X-Gateway-Rewritten-Path': targetPath
      });
      targetResponse.pipe(res);
    });
    upstream.setTimeout(5000, () => upstream.destroy(new Error('Account service timed out')));
    upstream.on('error', () => {
      if (res.headersSent) return res.destroy();
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Account service is unavailable' }));
    });
    req.on('aborted', () => upstream.destroy());
    req.pipe(upstream);
  });
  server.listen(port, '127.0.0.1', () => console.log(`Gateway and demo: http://localhost:${port}`));
  return server;
}

module.exports = { startGateway, rewritePath };
if (require.main === module) {
  startGateway(Number(process.env.GATEWAY_PORT || 8080), Number(process.env.ACCOUNT_PORT || 8081));
}
