"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

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

export function AdminClientWidgets() {
  return (
    <Suspense>
      <FloatingChatWidget />
    </Suspense>
  );
}
