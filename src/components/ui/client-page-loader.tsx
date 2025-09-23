// components/ui/page-loader.tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoaderCore() {
  const searchParams = useSearchParams(); // ← hook lives here
  /* your logic */
  return null;
}

export function ClientPageLoader() {
  return (
    <Suspense fallback={null}>
      <LoaderCore />
    </Suspense>
  );
}
