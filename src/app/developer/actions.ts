
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { doc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
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
    
    // For roles that don't need authentication, we create a document with a generated ID.
    const nonAuthRoles = ['Board Member', 'PTA Member'];
    if (nonAuthRoles.includes(role)) {
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
        // For roles that need authentication
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

        const userDocRef = doc(firestore, `schools/${schoolId}/users`, uid);
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
