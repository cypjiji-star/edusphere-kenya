
'use server';

import "server-only";
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

let app: App;

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please add it to your .env file.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Validate essential keys
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        throw new Error('Service account JSON is missing essential properties (project_id, client_email, private_key).');
    }

    return initializeApp({
        credential: credential.cert(serviceAccount),
    });

  } catch (error: any) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON in your .env file is not formatted correctly.");
  }
}
