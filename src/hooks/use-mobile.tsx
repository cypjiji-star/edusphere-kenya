"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // We only want to run this on the client
    if (typeof window !== "undefined") {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };

      checkIsMobile();
      window.addEventListener("resize", checkIsMobile);
      return () => window.removeEventListener("resize", checkIsMobile);
    }
  }, []);

  // To prevent hydration errors, we can return a default value on the server
  // and the actual value on the client after the first render.
  const [clientReady, setClientReady] = React.useState(false);
  React.useEffect(() => {
    setClientReady(true);
  }, []);

  return clientReady ? isMobile : false;
}
