import { createApp } from './app.ts';
import { recoverSync } from './services/conversations.ts';

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

if (process.env.FIREBASE_PROJECT_ID) {
  let recovering = false;
  const recover = async () => {
    if (recovering) return;
    recovering = true;
    try {
      await recoverSync();
    } catch {
      console.error('Sincronização de permissões pendente.');
    } finally {
      recovering = false;
    }
  };
  void recover();
  setInterval(() => void recover(), 30_000).unref();
}
