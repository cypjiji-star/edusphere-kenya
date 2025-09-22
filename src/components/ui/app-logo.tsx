
"use client";

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
        <circle cx="256" cy="256" r="200" fill="#0B0F19"/>
        <path d="M256 128L148 184V296" stroke="hsl(217 91% 60%)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M364 184V296L256 352L148 296" stroke="hsl(217 91% 60%)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M364 184L256 128" stroke="hsl(217 91% 60%)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M256 240V352" stroke="hsl(217 91% 60%)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M328.5 208L256 240L183.5 208" stroke="hsl(217 91% 60%)" strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M148 296L256 352L364 296" fill="hsl(217 91% 60%)" fillOpacity="0.2"/>
    </svg>
  );
}
