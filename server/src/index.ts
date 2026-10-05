import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
}

const app = createApp();
app.listen(port, '0.0.0.0', () => {
  console.info(`CP5 API iniciada na porta ${port}.`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close((error) => process.exit(error ? 1 : 0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
