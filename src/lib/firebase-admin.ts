"use server";

import { initializeApp, getApp, getApps, type App } from "firebase-admin/app";
import { credential } from "firebase-admin";

export async function getFirebaseAdminApp(): Promise<App> {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // The private key needs to have its escaped newlines replaced with actual newline characters.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK environment variables are not set. Please check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.",
    );
  }

  try {
    return initializeApp({
      credential: credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
    throw new Error(
      "Failed to initialize Firebase Admin SDK. Please check your environment variables.",
    );
  }
}
