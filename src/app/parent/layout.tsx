import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ParentSidebar } from "./parent-sidebar";
import { Suspense } from "react";
import { AuthCheck } from "@/lib/auth-check";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const FloatingSupportWidget = dynamic(
  () =>
    import("@/components/layout/floating-support-widget").then(
      (mod) => mod.FloatingSupportWidget,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  },
);

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck requiredRole="Parent">
      <SidebarProvider>
        <Sidebar>
          <Suspense>
            <ParentSidebar />
          </Suspense>
        </Sidebar>
        <SidebarInset className="relative h-screen max-h-screen overflow-auto p-2">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-end gap-4 border-b bg-background/80 px-6 backdrop-blur-sm md:hidden">
            <div className="flex-1">
              <SidebarTrigger />
            </div>
          </header>
          {children}
          <Suspense>
            <FloatingSupportWidget />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </AuthCheck>
  );
}
