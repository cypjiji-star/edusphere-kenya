
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { DeveloperSidebar } from './developer-sidebar';
import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Suspense fallback={<PageLoader />}>
          <DeveloperSidebar />
        </Suspense>
      </Sidebar>
      <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
        <main className="h-full w-full overflow-auto rounded-xl shadow bg-background">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
