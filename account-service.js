const http = require('node:http');

// Separate target service. Accounts are held in memory for this demonstration.
const accounts = [{ id: 1, name: 'Charan', balance: 3000 }];
let nextId = 2;

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function startAccountService(port = 8081) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.setHeader('X-Service-Path', url.pathname);
    console.log(`[account-service] ${req.method} ${req.url}`);

    if (url.pathname === '/internal/accounts' && req.method === 'GET') {
      return json(res, 200, accounts);
    }
    if (url.pathname === '/internal/accounts' && req.method === 'POST') {
      try {
        let body = '';
        for await (const chunk of req) {
          body += chunk;
          if (Buffer.byteLength(body) > 10000) {
            return json(res, 413, { error: 'Request body is too large' });
          }
        }
        const data = JSON.parse(body);
        if (typeof data?.name !== 'string' || !data.name.trim() ||
            typeof data.balance !== 'number' || !Number.isFinite(data.balance) || data.balance < 0) {
          return json(res, 400, { error: 'Enter a name and a non-negative numeric balance' });
        }
        const account = { id: nextId++, name: data.name.trim(), balance: data.balance };
        accounts.push(account);
        return json(res, 201, account);
      } catch {
        return json(res, 400, { error: 'Invalid JSON request body' });
      }
    }
    const match = url.pathname.match(/^\/internal\/accounts\/(\d+)$/);
    if (match && req.method === 'GET') {
      const account = accounts.find(item => item.id === Number(match[1]));
      return json(res, account ? 200 : 404, account || { error: 'Account not found' });
    }
    json(res, 404, { error: 'Route not found' });
  });
  server.listen(port, '127.0.0.1', () => console.log(`Account service: http://localhost:${port}/internal/accounts`));
  return server;
}

module.exports = { startAccountService };
if (require.main === module) startAccountService(Number(process.env.ACCOUNT_PORT || 8081));
