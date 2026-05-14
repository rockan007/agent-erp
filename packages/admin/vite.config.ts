import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function authPlugin() {
  return {
    name: 'erp-auth-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method === 'POST' && req.url === '/api/auth/login') {
          const body = await readBody(req);
          try {
            const { login, password } = JSON.parse(body);

            const { getKnex, initConnection } = await import('@erp/data');
            const { verifyPassword, signToken } = await import('@erp/core/auth');

            // Lazy-init DB connection if not already initialized
            let knex: any;
            try {
              knex = getKnex();
            } catch {
              knex = initConnection({
                host: process.env.DB_HOST ?? 'localhost',
                port: parseInt(process.env.DB_PORT ?? '5432'),
                database: process.env.DB_NAME ?? 'agent_erp',
                user: process.env.DB_USER ?? 'postgres',
                password: process.env.DB_PASSWORD ?? 'postgres',
              });
            }

            const user = await knex('res_users')
              .where({ login, active: true })
              .first();

            if (!user) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            const valid = await verifyPassword(password, user.password);
            if (!valid) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid credentials' }));
              return;
            }

            // Query user groups
            const groupRows = await knex('res_users_groups_rel')
              .where({ user_id: user.id })
              .select('group_id');

            const token = signToken({ userId: user.id, groups: groupRows.map((r: any) => String(r.group_id)) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              token,
              user: { id: user.id, name: user.name, groups: groupRows.map((r: any) => String(r.group_id)) },
            }));
          } catch (err) {
            console.error('auth error:', err);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
          }
        } else {
          next();
        }
      });
    },
  };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export default defineConfig({
  plugins: [authPlugin(), react()],
  server: {
    port: 3000,
  },
});
