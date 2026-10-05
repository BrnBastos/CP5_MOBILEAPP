import { createServer, type IncomingMessage } from 'node:http';
import { z } from 'zod';
import { ApiError } from './errors.ts';
import { services } from './services/firebase.ts';
import { route } from './routes/api.ts';

async function body(request: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > 65536) throw new ApiError(413, 'Requisição muito grande.');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new ApiError(400, 'JSON inválido.');
  }
}
export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    const send = (status: number, payload: unknown) => {
      response.writeHead(status);
      response.end(JSON.stringify(payload));
    };
    void (async () => {
      if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
      }
      const path = new URL(request.url ?? '/', 'http://localhost').pathname;
      if (request.method === 'GET' && path === '/health') {
        send(200, { status: 'ok', service: 'cp5-chat-api' });
        return;
      }
      if (request.method === 'GET' && path === '/ready') {
        await services().db.collection('_health').limit(1).get();
        send(200, { status: 'ready' });
        return;
      }
      if (!request.headers.authorization?.startsWith('Bearer '))
        throw new ApiError(401, 'Faça login para continuar.');
      let uid: string;
      try {
        const token = await services().auth.verifyIdToken(
          request.headers.authorization.slice(7),
          true,
        );
        if (token.firebase.sign_in_provider !== 'password')
          throw new ApiError(401, 'Use e-mail e senha.');
        uid = token.uid;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(401, 'Sessão inválida ou expirada.');
      }
      send(200, await route(request.method ?? 'GET', path, uid, await body(request)));
    })().catch((error: unknown) => {
      if (error instanceof ApiError) send(error.status, { error: error.message });
      else if (error instanceof z.ZodError)
        send(400, {
          error: 'Dados inválidos.',
          fields: error.issues.map((issue) => issue.path.join('.')),
        });
      else {
        console.error('API operation failed:', error instanceof Error ? error.name : 'unknown');
        send(500, { error: 'Não foi possível concluir a operação.' });
      }
    });
  });
}
