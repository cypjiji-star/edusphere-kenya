
'use server';

import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

type ActionType = 'User Management' | 'Finance' | 'Academics' | 'Settings' | 'Security' | 'Health' | 'General';

type AuditLogPayload = {
    schoolId: string;
    action: string; // e.g., USER_LOGIN_SUCCESS, GRADE_UPDATED
    actionType: ActionType;
    description: string; // e.g., "Brian Njoroge logged in."
    user: {
        id: string;
        name: string;
        role: string;
    };
    details?: string | { oldValue: any; newValue: any };
    ipAddress?: string;
    userAgent?: string;
};

/**
 * Creates an audit log entry in both the school-specific and platform-wide logs.
 * @param payload - The data for the audit log entry.
 */
export async function logAuditEvent(payload: AuditLogPayload) {
  try {
    const logData = {
      ...payload,
      timestamp: serverTimestamp(),
    };

    // Log to school-specific audit trail
    const schoolLogRef = collection(firestore, 'schools', payload.schoolId, 'audit_logs');
    await addDoc(schoolLogRef, logData);

    // Log to platform-wide audit trail
    const platformLogRef = collection(firestore, 'platform_audit_logs');
    await addDoc(platformLogRef, logData);
    
  } catch (error) {
    console.error("Failed to write audit event:", error);
    // In a real-world scenario, you might have more robust error handling,
    // like writing to a fallback log or alerting an admin.
  }
}
