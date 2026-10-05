import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../src/app.ts';

test('health responde via HTTP e endpoints desconhecidos são recusados', async (context) => {
  const app = createApp();
  app.listen(0, '127.0.0.1');
  context.after(
    () =>
      new Promise<void>((resolve, reject) => {
        app.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  await once(app, 'listening');
  const address = app.address();
  assert.ok(address && typeof address !== 'string');
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await health.json(), { status: 'ok', service: 'cp5-chat-api' });
  const missing = await fetch(`${baseUrl}/notifications/messages`, { method: 'POST' });
  assert.equal(missing.status, 401);
});
