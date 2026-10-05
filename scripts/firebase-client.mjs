import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectId = process.argv[2];
const namespace = 'com.brnbastos.cp5mobileapp';
const publicKeys = [
  'apiKey',
  'authDomain',
  'databaseURL',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

function firebase(args) {
  const child = spawnSync(
    'npx',
    ['--yes', 'firebase-tools@15.32.1', ...args, '--json', '--non-interactive'],
    { cwd: root, encoding: 'utf8', timeout: 180_000, maxBuffer: 8 * 1024 * 1024 },
  );
  // Do not echo CLI output: authentication responses/logs can contain credentials.
  if (child.error || child.status !== 0)
    throw new Error(`Firebase ${args[0]} falhou. Confira a autenticação e o acesso ao projeto.`);
  const response = JSON.parse(child.stdout);
  if (response.status !== 'success') throw new Error(`Firebase ${args[0]} não concluiu.`);
  return response.result;
}

try {
  if (!projectId || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId))
    throw new Error('Uso: npm run firebase:client -- ID_REAL_DO_PROJETO');
  const webFile = new URL('../firebaseConfig.json', import.meta.url);
  if (existsSync(webFile) && JSON.parse(readFileSync(webFile, 'utf8')).projectId !== projectId)
    throw new Error(
      'A configuração existente pertence a outro projeto. Revise antes de substituir.',
    );
  const projects = firebase(['projects:list']);
  if (!Array.isArray(projects) || !projects.some((project) => project.projectId === projectId))
    throw new Error('Projeto não encontrado na conta autenticada.');
  const configurations = {};
  for (const platform of ['WEB', 'ANDROID', 'IOS']) {
    const apps = firebase(['apps:list', platform, '--project', projectId]);
    if (!Array.isArray(apps)) throw new Error('Lista de aplicativos Firebase inválida.');
    const displayName = `CP5 Chat ${platform}`;
    let app = apps.find(
      (item) =>
        item.platform === platform &&
        (platform === 'WEB'
          ? item.displayName === displayName
          : platform === 'ANDROID'
            ? item.packageName === namespace
            : item.bundleId === namespace),
    );
    if (!app) {
      const flags =
        platform === 'ANDROID'
          ? ['--package-name', namespace]
          : platform === 'IOS'
            ? ['--bundle-id', namespace]
            : [];
      app = firebase(['apps:create', platform, displayName, ...flags, '--project', projectId]);
    }
    configurations[platform] = firebase([
      'apps:sdkconfig',
      platform,
      app.appId,
      '--project',
      projectId,
    ]);
  }
  const config = Object.fromEntries(
    publicKeys.map((key) => [key, configurations.WEB.sdkConfig?.[key]]),
  );
  if (config.projectId !== projectId || publicKeys.some((key) => !config[key]))
    throw new Error(
      'Configuração incompleta. Crie o Realtime Database antes de executar novamente.',
    );
  const android = JSON.parse(configurations.ANDROID.fileContents);
  const ios = configurations.IOS.fileContents;
  if (
    android.project_info?.project_id !== projectId ||
    !android.client?.some(
      (client) => client.client_info?.android_client_info?.package_name === namespace,
    ) ||
    typeof ios !== 'string' ||
    !new RegExp(`<key>PROJECT_ID</key>\\s*<string>${projectId}</string>`).test(ios) ||
    !ios.includes(`<string>${namespace}</string>`)
  )
    throw new Error('Os arquivos nativos não correspondem ao projeto/pacote esperado.');
  writeFileSync(webFile, `${JSON.stringify(config, null, 2)}\n`);
  writeFileSync(
    new URL('../google-services.json', import.meta.url),
    `${JSON.stringify(android, null, 2)}\n`,
  );
  writeFileSync(new URL('../GoogleService-Info.plist', import.meta.url), ios);
  await import('./configure-firebase.mjs');
  console.log(
    'Configurações públicas web, Android e iOS obtidas. Nenhum segredo Admin foi criado.',
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Não foi possível configurar Firebase.');
  process.exitCode = 1;
}
