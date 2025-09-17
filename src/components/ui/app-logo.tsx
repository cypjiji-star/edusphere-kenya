
import { cn } from "@/lib/utils";
import * as React from "react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M64 128C64 105.908 81.9081 88 104 88H408C430.092 88 448 105.908 448 128V344.821C448 354.542 444.153 363.856 437.388 370.621L285.388 522.621C270.83 537.179 247.17 537.179 232.612 522.621L80.6122 370.621C73.8473 363.856 64 354.542 64 344.821V128Z"
        fill="hsl(var(--primary))"
      />
      <path
        d="M328 200H184V248H280V296H184V344H328V392H136V152H328V200Z"
        fill="white"
      />
    </svg>
  );
}
