
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { TeacherSidebar } from './teacher-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { MessagingShortcut } from '@/components/messaging/messaging-shortcut';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck requiredRole="teacher">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <TeacherSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            {children}
             <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-4">
              <MessagingShortcut />
              <NotificationCenter />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
