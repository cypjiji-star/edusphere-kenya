
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ParentSidebar } from './parent-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AuthCheck requiredRole="parent">
        <SidebarProvider>
          <Sidebar>
            <Suspense>
              <ParentSidebar />
            </Suspense>
          </Sidebar>
          <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
            <main className="h-full w-full overflow-auto rounded-xl shadow bg-background">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </AuthCheck>
    </Suspense>
  );
}
