
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ArrowDownToLine, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppLogo } from '../ui/app-logo';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      // Store the event so it can be triggered later.
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      // Show the install prompt after a short delay
      setTimeout(() => setIsSheetOpen(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPromptEvent) {
      return;
    }
    await installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setInstallPromptEvent(null);
    setIsSheetOpen(false);
  };

  const handleClose = () => {
    setIsSheetOpen(false);
  };

  if (!isMobile || !installPromptEvent) {
    return null;
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-lg">
            <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                    <AppLogo className="h-6 w-6" />
                    Install EduSphere
                </SheetTitle>
                <SheetDescription>
                    Add EduSphere to your home screen for a faster, full-screen experience.
                </SheetDescription>
            </SheetHeader>
            <div className="py-4 flex gap-4">
                <Button onClick={handleInstallClick} className="w-full">
                    <ArrowDownToLine className="mr-2 h-4 w-4" />
                    Install App
                </Button>
                <Button variant="ghost" onClick={handleClose}>
                    Not Now
                </Button>
            </div>
        </SheetContent>
    </Sheet>
  );
}
