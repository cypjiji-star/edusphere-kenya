
'use server';

import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  const adminApp = getFirebaseAdminApp();
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
        user: { id: userRecord.uid, name: 'System', role: 'System' }, // Action performed by the system itself
        details: `New developer account created for ${email}.`
    });

    return { success: true, uid: userRecord.uid };
  } catch (error: any) {
    console.error("Error creating developer user:", error);
    return { success: false, message: error.message || 'Failed to create developer account.' };
  }
}
