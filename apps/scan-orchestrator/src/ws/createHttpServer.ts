import { createServer, type Server } from 'node:http';

/**
 * Plain node:http server — no Express, no @react-router/express adapter
 * (TECH_SPEC §2.7): this process never serves CRUD or React Router
 * traffic, only the WebSocket upgrade at /ws/runs and a bare health check.
 */
export const createHttpServer = (): Server =>
  createServer((request, response) => {
    if (request.url === '/healthz') {
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('ok');
      return;
    }

    response.writeHead(404);
    response.end();
  });
