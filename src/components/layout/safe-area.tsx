'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

interface SafeAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

/**
 * A component that applies padding to account for the safe area insets on mobile devices.
 * This is useful for wrapping top-level layout components to prevent content from being
 * obscured by device notches, status bars, or home indicators.
 */
const SafeArea = React.forwardRef<HTMLDivElement, SafeAreaProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          'pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]',
          className
        )}
        {...props}
      />
    );
  }
);
SafeArea.displayName = 'SafeArea';

export { SafeArea };
