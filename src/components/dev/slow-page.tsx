
'use client';

import * as React from 'react';

// This is a development-only component to simulate a slower page load
// to make the loading animation more visible.
export function SlowPage({ children }: { children: React.ReactNode }) {
  const [isShowing, setIsShowing] = React.useState(false);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setIsShowing(true);
    }, 500); // 0.5 second delay

    return () => clearTimeout(timeout);
  }, []);

  if (!isShowing) {
    return null;
  }

  return <>{children}</>;
}
