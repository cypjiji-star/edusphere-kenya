
'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { AiChat } from '../ai/ai-chat';

export function FloatingSupportWidget() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
          size="icon"
        >
          <HelpCircle className="h-8 w-8" />
          <span className="sr-only">Open Support Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Support Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0">
          <AiChat />
        </div>
      </SheetContent>
    </Sheet>
  );
}
