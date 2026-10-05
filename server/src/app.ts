import { createServer } from 'node:http';

export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    if (request.method === 'GET' && request.url === '/health') {
      response.writeHead(200);
      response.end(JSON.stringify({ status: 'ok', service: 'cp5-chat-api' }));
      return;
    }

    response.writeHead(404);
    response.end(JSON.stringify({ error: 'Endpoint não encontrado.' }));
  });
}
