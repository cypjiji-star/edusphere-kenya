
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DeveloperSidebar } from './developer-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <AuthCheck requiredRole="developer">
        <SidebarProvider>
          <Sidebar>
            <Suspense>
              <DeveloperSidebar />
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
