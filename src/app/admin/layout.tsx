
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { FloatingChatWidget } from './floating-chat-widget';

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
            <div className="md:hidden absolute top-4 left-4 z-20">
              <SidebarTrigger />
            </div>
            <div>{children}</div>
            <FloatingChatWidget />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
