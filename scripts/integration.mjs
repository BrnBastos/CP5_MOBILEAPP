import { spawn } from 'node:child_process';
const runner = spawn(
  'npx',
  [
    '--yes',
    'firebase-tools@15.32.1',
    'emulators:exec',
    '--only',
    'auth,firestore,database',
    '--project',
    'demo-cp5',
    'npm --prefix server run test',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      FIREBASE_PROJECT_ID: 'demo-cp5',
      FIREBASE_DATABASE_URL: 'https://demo-cp5-default-rtdb.firebaseio.com',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIREBASE_DATABASE_EMULATOR_HOST: '127.0.0.1:9000',
    },
  },
);
runner.on('error', () => {
  console.error('Não foi possível iniciar os emuladores. Confira Node.js e Java 21.');
  process.exitCode = 1;
});
runner.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
