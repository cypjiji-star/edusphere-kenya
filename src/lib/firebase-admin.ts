
'use server';

import "server-only";
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

let app: App;

export function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        return initializeApp({
            credential: credential.cert(serviceAccount),
        });
    } catch (error: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
        throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON in your .env file is not formatted correctly.");
    }
  }

  // Fallback to individual variables if the full JSON is not provided
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error('Firebase Admin credentials are not set. Please add FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID to your .env file.');
  }

  return initializeApp({
    credential: credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'), // Replace escaped newlines
    }),
  });
}
