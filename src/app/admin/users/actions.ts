
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';

/**
 * Deletes a user from Firebase Authentication.
 * This is a privileged operation and must only be executed on the server.
 * @param uid The user's unique ID.
 */
export async function deleteUserAction(uid: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    await auth.deleteUser(uid);
    return { success: true, message: 'Authentication record deleted.' };
  } catch (error: any) {
    console.error("Error deleting user from Firebase Auth:", error);
    if (error.code === 'auth/user-not-found') {
        // If user doesn't exist in Auth, it might be an orphan record.
        // We can consider this a "success" in terms of cleaning up.
        return { success: true, message: 'User not found in Auth, proceeding with DB cleanup.' };
    }
    return { success: false, message: error.message || 'Failed to delete user authentication.' };
  }
}
