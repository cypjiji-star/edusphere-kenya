
import "server-only";
import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

let app: App;

export function getFirebaseAdminApp() {
  if (app) {
    return app;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. Please add it to your .env file.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp({
        credential: credential.cert(serviceAccount),
      });
    }

    return app;
  } catch (error: any) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", error.message);
    throw new Error("The FIREBASE_SERVICE_ACCOUNT_JSON in your .env file is not formatted correctly.");
  }
}
