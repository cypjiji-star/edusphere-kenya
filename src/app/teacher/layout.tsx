
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
    <AuthCheck requiredRole="teacher">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <TeacherSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset>
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
             <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
              <SidebarTrigger />
            </header>
            {children}
            <FloatingSupportWidget />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
