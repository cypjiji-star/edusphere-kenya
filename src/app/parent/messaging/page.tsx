
import { ChatLayout } from './chat-layout';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MessagingContent() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing from URL.</div>
  }

  return (
    <div className="h-full w-full">
      <ChatLayout />
    </div>
  );
}

export default function MessagingPage() {
    return (
        <Suspense>
            <MessagingContent />
        </Suspense>
    )
}
