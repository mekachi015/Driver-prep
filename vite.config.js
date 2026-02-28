import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'local-api',
        configureServer(server) {
          const localDB = { tickets: {}, results: [] };

          const readBody = (req) => new Promise((resolve, reject) => {
            let b = '';
            req.on('data', c => (b += c));
            req.on('end', () => { try { resolve(JSON.parse(b)); } catch { reject(); } });
          });

          const handle = (key, empty) => async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            if (req.method === 'GET') {
              res.statusCode = 200;
              res.end(JSON.stringify(localDB[key] ?? empty));
            } else if (req.method === 'POST') {
              localDB[key] = await readBody(req);
              res.statusCode = 200;
              res.end(JSON.stringify({ ok: true }));
            } else {
              res.statusCode = 405; res.end();
            }
          };

          server.middlewares.use('/api/tickets', handle('tickets', {}));
          server.middlewares.use('/api/results', handle('results', []));

          server.middlewares.use('/api/admin-login', (req, res) => {
            if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', () => {
              try {
                const { pin } = JSON.parse(body);
                if (!pin || pin !== env.ADMIN_PIN) {
                  res.statusCode = 401;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Incorrect PIN' }));
                  return;
                }
                const token = Buffer.from(
                  `admin:${Date.now() + 8 * 60 * 60 * 1000}`
                ).toString('base64');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ token }));
              } catch {
                res.statusCode = 500;
                res.end();
              }
            });
          });
        },
      },
    ],
  }
})
