"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/layout/header";
import { AppFooter } from "@/components/layout/footer";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <WifiOff className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold font-headline mb-2">
            You are Offline
          </h1>
          <p className="text-muted-foreground mb-6">
            It looks like you've lost your internet connection. Please check it
            and try again.
          </p>
          <Button onClick={handleRetry}>Retry Connection</Button>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
