
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ParentSidebar } from './parent-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { NotificationCenter } from '@/components/notifications/notification-center';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck requiredRole="parent">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <ParentSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            {children}
            <div className="absolute bottom-6 right-6 z-50">
              <NotificationCenter />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
