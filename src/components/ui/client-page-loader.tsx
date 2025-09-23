"use client";

import { usePathname } from "next/navigation";

export function ClientPageLoader() {
  const pathname = usePathname();

  // don’t run on 404 or any non-existent route
  if (pathname === "/404" || pathname === "/_not-found") return null;

  /* your existing loader logic (no hooks that crash) */
  return null;
}
