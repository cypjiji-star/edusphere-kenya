
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

  // If the user is on the one-time creation page, don't run the auth check.
  if (pathname === '/developer/create-dev-account') {
    return <Suspense>{children}</Suspense>;
  }

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
