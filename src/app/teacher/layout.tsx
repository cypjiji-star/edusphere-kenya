
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { TeacherSidebar } from './teacher-sidebar';
import { Suspense } from 'react';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <Suspense>
          <TeacherSidebar />
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
