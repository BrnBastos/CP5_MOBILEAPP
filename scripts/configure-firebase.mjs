import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const filename = new URL('../firebaseConfig.json', import.meta.url);
let config = null;
if (existsSync(filename)) {
  config = JSON.parse(readFileSync(filename, 'utf8'));
  for (const key of [
    'apiKey',
    'authDomain',
    'databaseURL',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]) {
    if (typeof config[key] !== 'string' || !config[key])
      throw new Error(`firebaseConfig.json: ${key} ausente.`);
  }
  if ('private_key' in config || 'privateKey' in config || 'client_email' in config)
    throw new Error('Credencial administrativa não permitida no cliente.');
}
writeFileSync(
  new URL('../src/services/firebaseConfig.generated.ts', import.meta.url),
  `// Gerado a partir de firebaseConfig.json.\nimport type { FirebaseOptions } from 'firebase/app';\nexport const firebaseClientConfig: FirebaseOptions | null = ${JSON.stringify(config, null, 2)};\n`,
);
