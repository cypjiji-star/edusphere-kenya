
"use client";

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { Suspense } from "react";
import { AuthCheck } from "@/lib/auth-check";
import { FloatingChatWidget } from "@/components/layout/floating-support-widget";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Don't apply admin layout to sub-pages that have their own layout
  if (pathname.includes("/admin/timetable")) {
    return <Suspense>{children}</Suspense>;
  }

  return (
    <AuthCheck requiredRole="admin">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <AdminSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="h-screen max-h-screen overflow-hidden p-2">
          <main className="relative h-full w-full overflow-auto rounded-xl shadow bg-background">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
                <SidebarTrigger />
            </header>
            <Suspense>{children}</Suspense>
            <Suspense>
              <FloatingChatWidget />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
