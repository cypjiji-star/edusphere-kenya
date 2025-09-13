
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './admin-sidebar';
import { Suspense } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Suspense>
          <AdminSidebar />
        </Suspense>
      </Sidebar>
      <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
        <main className="h-full w-full overflow-auto rounded-xl shadow bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
