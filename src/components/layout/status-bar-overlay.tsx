'use client';

import { cn } from '@/lib/utils';

/**
 * A component that renders a translucent overlay over the system status bar area
 * on mobile devices, creating a "glassmorphism" effect.
 * It uses the `safe-area-inset-top` CSS variable to dynamically match the
 * height of the device's status bar or notch.
 */
export function StatusBarOverlay({ className }: { className?: string }) {
  return <div className={cn('status-bar-glass', className)} />;
}
