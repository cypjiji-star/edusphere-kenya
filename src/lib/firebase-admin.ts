import "server-only";

import * as admin from "firebase-admin";
import { getApps } from "firebase-admin/app";
import { firebaseConfig } from "./firebase";

export function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: firebaseConfig.projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
