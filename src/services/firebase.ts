import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import * as authModule from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import { firebaseClientConfig } from './firebaseConfig.generated';

export function firebase() {
  if (!firebaseClientConfig)
    throw new Error('Configuração Firebase pendente. Conecte o projeto para começar.');
  const exists = getApps().length > 0;
  const app = exists ? getApp() : initializeApp(firebaseClientConfig);
  // The RN export exists at runtime but the package's browser declarations omit it.
  const nativeAuth = authModule as typeof authModule & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  };
  const auth =
    exists || Platform.OS === 'web'
      ? getAuth(app)
      : initializeAuth(app, { persistence: nativeAuth.getReactNativePersistence(AsyncStorage) });
  return { auth, db: getFirestore(app), realtime: getDatabase(app) };
}
