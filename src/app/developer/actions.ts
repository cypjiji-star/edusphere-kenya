
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { doc, setDoc, serverTimestamp, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { logAuditEvent } from '@/lib/audit-log.service';


export async function createDeveloperUserAction(params: {
  email: string;
  password?: string;
}) {
  const { email, password } = params;

  if (!email || !password) {
    return { success: false, message: 'Email and password are required.' };
  }

  // Use the Firebase Admin SDK to create the user.
  // This is a privileged operation.
  const adminApp = await getFirebaseAdminApp();
  const auth = getAuth(adminApp);
  
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: 'Developer',
    });

    // Add user to the 'developers' collection in Firestore to assign the role
    const devDocRef = doc(firestore, 'developers', userRecord.uid);
    await setDoc(devDocRef, {
      uid: userRecord.uid,
      email: userRecord.email,
      role: 'developer',
      createdAt: serverTimestamp(),
    });
    
    // Log this important security event
    await logAuditEvent({
        schoolId: 'platform', // This is a platform-level action
        action: 'DEVELOPER_CREATED',
        actionType: 'Security',
        description: `New developer account created for ${email}.`,
        user: { id: userRecord.uid, name: 'System', role: 'System' }, // Action performed by the system itself
        details: `New developer account created for ${email}.`
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating developer user:", error);
    return { success: false, message: error.message || 'Failed to create developer account.' };
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
    const adminApp = await getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    
    const isNonAuthRole = ['Board Member', 'PTA Member'].includes(role);
    const isAdminRole = role === 'Admin';
    
    if (isNonAuthRole) {
        const newUserDocRef = doc(collection(firestore, `schools/${schoolId}/users`));
        uid = newUserDocRef.id;
        
        const userData = {
            id: uid, schoolId, name, role, 
            phone: phone || null, 
            startYear: startYear || null, 
            salary: salary || null, 
            nationalId: nationalId || null,
            status: 'Active', createdAt: serverTimestamp(),
        };
        await setDoc(newUserDocRef, userData);

    } else {
        // For roles that need authentication (Admin, Teacher, Parent, Student)
        if (!email || !password) {
            return { success: false, message: 'Email and password are required for this role.' };
        }
        
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            disabled: false,
        });
        uid = userRecord.uid;
        
        const avatarUrl = `https://picsum.photos/seed/${uid}/100`;
        const collectionPath = isAdminRole ? `schools/${schoolId}/admins` : `schools/${schoolId}/users`;
        const userDocRef = doc(firestore, collectionPath, uid);

        const userData = {
            id: uid, schoolId, name, email, role, 
            phone: phone || null, 
            startYear: startYear || null, 
            salary: salary || null, 
            nationalId: nationalId || null,
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
  } catch (error: any) {
    console.error("Error creating new user:", error);
    return { success: false, message: error.message || 'Failed to create user.' };
  }
}

/**
 * Deletes a user from Firebase Authentication and their Firestore record.
 */
export async function deleteUserAction(userId: string, schoolId: string) {
  if (!userId || !schoolId) {
    return { success: false, message: 'User ID and School ID are required.' };
  }

  try {
    const adminApp = await getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    
    // Attempt to delete from Firebase Auth. This will fail if the user is non-auth, which is fine.
    try {
      await auth.deleteUser(userId);
    } catch (error: any) {
        if (error.code !== 'auth/user-not-found') {
            throw error; // Re-throw if it's not a "user not found" error
        }
        // If user is not in Auth, proceed to delete from Firestore.
    }

    // Delete from Firestore. Check both collections.
    const userDocRef = doc(firestore, `schools/${schoolId}/users`, userId);
    const adminDocRef = doc(firestore, `schools/${schoolId}/admins`, userId);

    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        await deleteDoc(userDocRef);
    } else {
        await deleteDoc(adminDocRef);
    }

    return { success: true, message: 'User deleted successfully.' };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, message: error.message || 'Failed to delete user.' };
  }
}

/**
 * Updates a user's details in Firebase Authentication.
 */
export async function updateUserAuthAction(userId: string, updates: { email?: string; password?: string; displayName?: string; disabled?: boolean; }) {
   if (!userId) {
    return { success: false, message: 'User ID is required.' };
  }

  try {
    const adminApp = await getFirebaseAdminApp();
    const auth = getAuth(adminApp);
    await auth.updateUser(userId, updates);
    return { success: true, message: 'User authentication details updated.' };
  } catch (error: any) {
    console.error("Error updating user auth:", error);
    return { success: false, message: error.message || 'Failed to update user auth details.' };
  }
}
