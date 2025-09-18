
'use client';

import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DeveloperSidebar } from './developer-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { usePathname } from 'next/navigation';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Allow access to developer create page without auth
  if (pathname === '/developer/create-dev-account') {
      return <Suspense>{children}</Suspense>;
  }

  return (
    <AuthCheck requiredRole="developer">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <DeveloperSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
          <main className="h-full w-full overflow-auto rounded-xl shadow bg-background">
            <Suspense>{children}</Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
