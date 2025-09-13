
'use client';

import * as React from 'react';

// This is a development-only component to simulate a slower page load
// to make the loading animation more visible.
// It uses a simple Promise to suspend rendering, which correctly
// triggers the React Suspense boundary.
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let hasSlept = false;

export function SlowPage({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined' && !hasSlept) {
    throw sleep(500).then(() => {
        hasSlept = true;
    });
  }

  React.useEffect(() => {
    // Reset the flag on unmount so the loader shows on next navigation
    return () => {
      hasSlept = false;
    };
  }, []);

  return <>{children}</>;
}
