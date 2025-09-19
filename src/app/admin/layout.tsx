
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { NotificationCenter } from '@/components/notifications/notification-center';

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
        <SidebarInset className="h-screen max-h-screen overflow-hidden">
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
              <SidebarTrigger />
            </header>
            {children}
          </main>
        </SidebarInset>
         <div className="fixed bottom-6 right-6 z-50">
            <NotificationCenter />
        </div>
      </SidebarProvider>
    </AuthCheck>
  );
}
