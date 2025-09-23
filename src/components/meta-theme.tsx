"use client";

import * as React from "react";

/**
 * A server-safe component to set the browser's theme color and the mobile app's status bar style.
 * It uses a client-side effect to inject a style tag, preventing hydration mismatches
 * that can be caused by browser extensions modifying the initial server-rendered HTML.
 */
export const MetaTheme = ({ color }: { color: string }) => {
  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `html,body{background:${color}}`;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [color]);

  return (
    <>
      <meta name="theme-color" content={color} />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />
    </>
  );
};
