
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
        <SidebarInset className="relative h-screen max-h-screen overflow-auto p-2">
           <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            <SidebarTrigger />
            <div>{children}</div>
            <FloatingSupportWidget />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
