import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ParentSidebar } from './parent-sidebar';
import { Suspense } from 'react';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Suspense fallback={<div>Loading...</div>}>
          <ParentSidebar />
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
