
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

/**
 * Updates a user's details in Firebase Authentication.
 * This is a privileged operation and must only be executed on the server.
 * @param uid The user's unique ID.
 * @param updates An object containing the fields to update (e.g., email, password).
 */
export async function updateUserAuthAction(uid: string, updates: { email?: string; password?: string }) {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    await auth.updateUser(uid, updates);
    return { success: true, message: 'Authentication record updated successfully.' };
  } catch (error: any) {
    console.error("Error updating user in Firebase Auth:", error);
    return { success: false, message: error.message || 'Failed to update user authentication.' };
  }
}


/**
 * Deletes a user from Firebase Authentication.
 * This is a privileged operation and must only be executed on the server.
 * @param uid The user's unique ID.
 */
export async function deleteUserAction(uid: string, schoolId: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    await auth.deleteUser(uid);
    
    // Create a notification for this security event
    await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
      title: 'Security Alert: User Deleted',
      description: `A user account (UID: ${uid.substring(0,10)}...) was permanently deleted.`,
      createdAt: serverTimestamp(),
      category: 'Security',
      href: `/admin/logs?schoolId=${schoolId}`,
      audience: 'admin'
    });
    
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

