
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { Suspense } from "react";
import { AuthCheck } from "@/lib/auth-check";
import { FloatingChatWidget } from "../admin/client-widgets";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <SidebarTrigger />
            {children}
            <Suspense>
              <FloatingChatWidget />
            </Suspense>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
