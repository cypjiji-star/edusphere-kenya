
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { addDoc, collection, serverTimestamp, setDoc, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { logAuditEvent } from '@/lib/audit-log.service';

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
 * Deletes a user from Firebase Authentication and Firestore.
 * This is a privileged operation and must only be executed on the server.
 * @param uid The user's unique ID.
 * @param schoolId The school ID.
 * @param role The user's role, to find the correct Firestore collection.
 */
export async function deleteUserAction(uid: string, schoolId: string, role: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);

    // Attempt to delete from Firebase Auth first
    try {
        await auth.deleteUser(uid);
    } catch (error: any) {
        // If user doesn't exist in Auth, we can still proceed with DB cleanup.
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw other auth errors
        }
    }
    
    // Determine the correct collection based on the role
    const nonTeachingRoles = ['Watchman', 'Cook', 'Board Member', 'PTA Member', 'Matron', 'Patron', 'Farm Worker', 'Cleaner'];
    let roleCollectionName = role.toLowerCase() + 's';
    if (nonTeachingRoles.includes(role)) {
      roleCollectionName = 'non_teaching_staff';
    }

    const userDocRef = doc(firestore, 'schools', schoolId, roleCollectionName, uid);
    await deleteDoc(userDocRef);
    
    // Create a notification for this security event
    await addDoc(collection(firestore, `schools/${schoolId}/notifications`), {
      title: 'Security Alert: User Deleted',
      description: `A user account (UID: ${uid.substring(0,10)}...) was permanently deleted.`,
      createdAt: serverTimestamp(),
      category: 'Security',
      href: `/admin/logs?schoolId=${schoolId}`,
      audience: 'admin'
    });
    
    return { success: true, message: 'User record completely deleted.' };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message || 'Failed to delete user.' };
  }
}


/**
 * Creates a new user in Firebase Authentication and a corresponding user document in Firestore.
 * This is a privileged server-side operation.
 */
export async function createUserAction(params: {
  schoolId: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  actor: { id: string; name: string };
  classes?: string[];
}) {
  const { schoolId, email, password, name, role, actor, classes } = params;

  if (!email || !name || !role) {
    return { success: false, message: 'Missing required user information.' };
  }

  const adminApp = getFirebaseAdminApp();
  const auth = getAuth(adminApp);

  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password: password, // Password can be optional if you send a verification link
      displayName: name,
      disabled: false,
    });

    const uid = userRecord.uid;
    const avatarUrl = `https://picsum.photos/seed/${uid}/100`;

    // 2. Determine the correct collection and create the user document
    const nonTeachingRoles = ['Watchman', 'Cook', 'Board Member', 'PTA Member', 'Matron', 'Patron', 'Farm Worker', 'Cleaner'];
    let roleCollectionName = role.toLowerCase() + 's'; 
    if (nonTeachingRoles.includes(role)) {
      roleCollectionName = 'non_teaching_staff';
    }
    
    const userDocRef = doc(firestore, 'schools', schoolId, roleCollectionName, uid);
    
    const userData: any = {
      id: uid,
      schoolId,
      name,
      email,
      role,
      status: 'Active',
      createdAt: serverTimestamp(),
      lastLogin: null,
      avatarUrl,
    };

    if (role === 'Teacher' && classes) {
      userData.classIds = classes;
    }
    
    await setDoc(userDocRef, userData);
    
    // 3. Log the audit event
    await logAuditEvent({
        schoolId,
        action: 'USER_CREATED',
        actionType: 'User Management',
        description: `New user account created for ${name} (${email}) with role ${role}.`,
        user: { id: actor.id, name: actor.name, role: 'Admin' },
        details: `User ID: ${uid}`,
    });

    return { success: true, uid, message: 'User created successfully.' };
  } catch (error: any) {
    console.error("Error creating new user:", error);
     // If user creation fails in Auth, we don't need to worry about cleanup.
    return { success: false, message: error.message || 'Failed to create user.' };
  }
}
