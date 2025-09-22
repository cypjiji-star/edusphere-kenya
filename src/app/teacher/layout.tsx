
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { TeacherSidebar } from './teacher-sidebar';
import { Suspense } from 'react';
import { AuthCheck } from '@/lib/auth-check';
import { FloatingSupportWidget } from '@/components/layout/floating-support-widget';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck requiredRole="Teacher">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <TeacherSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            <div className="md:hidden absolute top-4 left-4 z-20">
              <SidebarTrigger />
            </div>
            <div>{children}</div>
            <FloatingSupportWidget />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
