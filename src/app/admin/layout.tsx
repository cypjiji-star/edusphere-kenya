
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { MessagingShortcut } from '@/components/messaging/messaging-shortcut';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck requiredRole="admin">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <AdminSidebar />
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
