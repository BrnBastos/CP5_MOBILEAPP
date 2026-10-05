import { generateKeyPairSync } from 'node:crypto';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';
import { ApiError } from '../errors.ts';

export function services() {
  if (!getApps().length) {
    const {
      FIREBASE_PROJECT_ID: projectId,
      FIREBASE_DATABASE_URL: databaseURL,
      FIREBASE_CLIENT_EMAIL: clientEmail,
      FIREBASE_PRIVATE_KEY: privateKey,
    } = process.env;
    if (!projectId || !databaseURL)
      throw new ApiError(503, 'Integração Firebase ainda não configurada.');
    const emulator = Boolean(
      process.env.FIREBASE_AUTH_EMULATOR_HOST &&
      process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.FIREBASE_DATABASE_EMULATOR_HOST,
    );
    if (!emulator && (!clientEmail || !privateKey))
      throw new ApiError(503, 'Integração Firebase ainda não configurada.');
    const credential = emulator
      ? cert({
          projectId,
          clientEmail: `emulator@${projectId}.iam.gserviceaccount.com`,
          privateKey: generateKeyPairSync('rsa', {
            modulusLength: 2048,
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            publicKeyEncoding: { type: 'spki', format: 'pem' },
          }).privateKey,
        })
      : cert({
          projectId,
          clientEmail: clientEmail!,
          privateKey: privateKey!.replace(/\\n/g, '\n'),
        });
    if (emulator)
      credential.getAccessToken = async () => ({ access_token: 'owner', expires_in: 3600 });
    initializeApp({ projectId, databaseURL, credential });
  }
  return {
    auth: getAuth(),
    db: getFirestore(),
    realtime: getDatabase(),
    messaging: getMessaging(),
  };
}
