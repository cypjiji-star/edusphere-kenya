
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ParentSidebar } from './parent-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { NotificationBell } from '@/components/notifications/notification-bell';

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
        <SidebarInset>
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
             <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
              <NotificationBell />
              <SidebarTrigger />
            </header>
            <div className="p-4 sm:p-6 lg:p-8">{children}</div>
          </main>
          <div className="fixed bottom-6 right-6 z-50 hidden md:block">
            <NotificationBell />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
