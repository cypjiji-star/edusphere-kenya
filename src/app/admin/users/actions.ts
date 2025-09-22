
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
 */
export async function deleteUserAction(uid: string, schoolId: string) {
  try {
    const adminApp = getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    
    await auth.deleteUser(uid).catch(error => {
        // If user is not in Auth (e.g. created before auth was enforced), don't fail the whole operation
        if (error.code !== 'auth/user-not-found') {
            throw error;
        }
    });
    
    const userDocRef = doc(firestore, 'schools', schoolId, 'users', uid);
    await deleteDoc(userDocRef);
    
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
  email?: string;
  password?: string;
  name: string;
  role: string;
  actor: { id: string; name: string };
  classes?: string[];
  phone?: string;
  startYear?: string;
  salary?: string;
  nationalId?: string;
}) {
  const { schoolId, email, password, name, role, actor, classes, phone, startYear, salary, nationalId } = params;

  if (!name || !role) {
    return { success: false, message: 'Missing required user information.' };
  }
  
  try {
    let uid: string;
    
    // For roles that don't need authentication, we create a document with a generated ID.
    const nonAuthRoles = ['Board Member', 'PTA Member'];
    if (nonAuthRoles.includes(role)) {
        const newUserDocRef = doc(collection(firestore, `schools/${schoolId}/users`));
        uid = newUserDocRef.id;
        
        const userData = {
            id: uid, schoolId, name, role, phone, startYear, salary, nationalId,
            status: 'Active', createdAt: serverTimestamp(),
        };
        await setDoc(newUserDocRef, userData);

    } else {
        // For roles that need authentication
        if (!email || !password) {
            return { success: false, message: 'Email and password are required for this role.' };
        }
        const adminApp = getFirebaseAdminApp();
        const auth = getAuth(adminApp);
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            disabled: false,
        });
        uid = userRecord.uid;
        
        const avatarUrl = `https://picsum.photos/seed/${uid}/100`;

        const userDocRef = doc(firestore, `schools/${schoolId}/users`, uid);
        const userData = {
            id: uid, schoolId, name, email, role, phone, startYear, salary, nationalId,
            status: 'Active', createdAt: serverTimestamp(), lastLogin: null, avatarUrl,
            ...(role === 'Teacher' && { classIds: classes }),
        };
        await setDoc(userDocRef, userData);
    }
    
    // Log the audit event
    await logAuditEvent({
        schoolId,
        action: 'USER_CREATED',
        actionType: 'User Management',
        description: `New user record created for ${name} with role ${role}.`,
        user: { id: actor.id, name: actor.name, role: 'Admin' },
        details: `User ID: ${uid}`,
    });

    return { success: true, uid, message: 'User record created successfully.' };
  } catch (error: any {
    console.error("Error creating new user:", error);
    return { success: false, message: error.message || 'Failed to create user.' };
  }
}

