
'use client';

import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-primary/50"></div>
        <GraduationCap className="h-10 w-10 animate-pulse text-primary" />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        Loading your campus data...
      </p>
    </div>
  );
}
