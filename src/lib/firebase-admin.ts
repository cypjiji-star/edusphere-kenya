
'use server';

import "server-only";
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

let app: App;

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!serviceAccount.privateKey || !serviceAccount.clientEmail) {
    throw new Error('Firebase Admin credentials are not set in environment variables.');
  }

  return initializeApp({
      credential: credential.cert(serviceAccount),
  });
}
