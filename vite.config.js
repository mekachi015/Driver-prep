import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed ones like ADMIN_PIN)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'local-api',
        configureServer(server) {
          // Replicate the Vercel /api/admin-login handler for local dev
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
