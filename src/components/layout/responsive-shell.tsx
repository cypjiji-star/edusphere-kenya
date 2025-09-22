
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function ResponsiveShell({ children, className, ...props }: ResponsiveShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col", className)} {...props}>
      {children}
    </div>
  );
}
