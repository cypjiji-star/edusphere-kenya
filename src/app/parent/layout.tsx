
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ParentSidebar } from './parent-sidebar';
import { Suspense } from 'react';
import { PageLoader } from '@/components/ui/page-loader';
import { SlowPage } from '@/components/dev/slow-page';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Suspense fallback={<PageLoader />}>
          <ParentSidebar />
        </Suspense>
      </Sidebar>
      <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
        <main className="h-full w-full overflow-auto rounded-xl shadow bg-background">
          <Suspense fallback={<PageLoader />}>
            <SlowPage>{children}</SlowPage>
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
