import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { Suspense } from "react";
import { AuthCheck } from "@/lib/auth-check";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const FloatingChatWidget = dynamic(
  () =>
    import("./floating-chat-widget").then((mod) => mod.FloatingChatWidget),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  },
);

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
