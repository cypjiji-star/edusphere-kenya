'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const FloatingSupportWidget = dynamic(
  () =>
    import('@/components/layout/floating-support-widget').then(
      (mod) => mod.FloatingSupportWidget
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);
