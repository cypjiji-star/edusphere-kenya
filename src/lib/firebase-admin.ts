
import "server-only";

import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { firebaseConfig } from "./firebase";

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error(
      "Firebase Admin credentials (FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL) are not set in the environment. Please add them to your .env file."
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      clientEmail: clientEmail,
      privateKey: privateKey,
    }),
  });
}
