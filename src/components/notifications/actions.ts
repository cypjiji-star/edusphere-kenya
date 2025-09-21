
'use server';

import { firestore } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export async function sendQuickReplyAction(
  schoolId: string,
  chatId: string,
  replyContent: string,
  actor: { id: string; name: string }
) {
  if (!schoolId || !chatId || !replyContent || !actor.id) {
    return { success: false, message: 'Missing required information.' };
  }

  const chatDocRef = doc(firestore, `schools/${schoolId}/support-chats`, chatId);

  const adminMessage = {
    role: 'admin',
    content: replyContent,
    senderName: actor.name,
    timestamp: serverTimestamp(),
  };

  try {
    await updateDoc(chatDocRef, {
      messages: arrayUnion(adminMessage),
      lastMessage: replyContent,
      lastUpdate: serverTimestamp(),
    });
    return { success: true, message: 'Reply sent successfully.' };
  } catch (error) {
    console.error('Error sending quick reply:', error);
    return { success: false, message: 'Failed to send reply.' };
  }
}
