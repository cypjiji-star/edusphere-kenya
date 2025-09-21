
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
    
    const nonTeachingRoles = ['Watchman', 'Cook', 'Board Member', 'PTA Member', 'Matron', 'Patron', 'Farm Worker', 'Cleaner'];
    const isNonTeaching = nonTeachingRoles.includes(role);

    // Only try to delete from Auth if it's NOT a non-teaching staff member
    if (!isNonTeaching) {
        try {
            await auth.deleteUser(uid);
        } catch (error: any) {
            // If user is not in Auth (e.g. created before auth was enforced), don't fail the whole operation
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }
    }
    
    let roleCollectionName = isNonTeaching ? 'non_teaching_staff' : role.toLowerCase() + 's';

    const userDocRef = doc(firestore, 'schools', schoolId, roleCollectionName, uid);
    await deleteDoc(userDocRef);
    
    // Also delete from the general 'users' collection if it exists there
    const generalUserDocRef = doc(firestore, 'schools', schoolId, 'users', uid);
    await deleteDoc(generalUserDocRef).catch(() => {}); // Ignore error if it doesn't exist
    
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
  
  const nonTeachingRoles = ['Watchman', 'Cook', 'Board Member', 'PTA Member', 'Matron', 'Patron', 'Farm Worker', 'Cleaner'];
  const isNonTeachingStaff = nonTeachingRoles.includes(role);
  
  try {
    let uid: string;
    let finalUserData: any;

    const batch = writeBatch(firestore);

    if (isNonTeachingStaff) {
      // This is a record, not a login-enabled user.
      const newDocRef = doc(collection(firestore, 'schools', schoolId, 'non_teaching_staff'));
      uid = newDocRef.id;

      finalUserData = {
        id: uid,
        schoolId,
        name,
        role,
        phone,
        startYear,
        salary,
        nationalId,
        status: 'Active',
        createdAt: serverTimestamp(),
      };
      batch.set(newDocRef, finalUserData);

    } else {
      // This is a user with login credentials.
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

      const roleCollectionName = role.toLowerCase() + 's';
      const roleDocRef = doc(firestore, 'schools', schoolId, roleCollectionName, uid);
      const generalUserDocRef = doc(firestore, 'schools', schoolId, 'users', uid);

      finalUserData = {
        id: uid,
        schoolId,
        name,
        email,
        role,
        phone,
        startYear,
        salary,
        nationalId,
        status: 'Active',
        createdAt: serverTimestamp(),
        lastLogin: null,
        avatarUrl,
      };

      if (role === 'Teacher' && classes) {
        finalUserData.classIds = classes;
      }
      
      batch.set(roleDocRef, finalUserData);
      batch.set(generalUserDocRef, { name, role });
    }
    
    await batch.commit();

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
  } catch (error: any) {
    console.error("Error creating new user:", error);
    return { success: false, message: error.message || 'Failed to create user.' };
  }
}
