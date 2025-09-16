import { cn } from "@/lib/utils";
import * as React from "react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--primary) / 0.8)", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path d="M50 10 C 20 20, 20 60, 50 90 C 80 60, 80 20, 50 10 Z" fill="url(#grad1)" />
      <path d="M50 25 L 20 40 L 50 55 L 80 40 L 50 25 M 20 40 L 20 60 L 50 75 L 50 55" fill="white" fillOpacity="0.9"/>
      <path d="M50 55 L 50 75 L 80 60 L 80 40 L 50 55" fill="white" fillOpacity="0.5"/>
      <path d="M50,25 L55,27 L55,35 L45,35 L45,27 Z" fill="white"/>
      <rect x="52" y="18" width="6" height="10" fill="hsl(var(--accent))" transform="rotate(20 55 23)"/>
    </svg>
  );
}
