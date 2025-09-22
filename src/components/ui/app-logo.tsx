
"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="glow" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#00BFFF', stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: '#00BFFF', stopOpacity: 0.3 }} />
        </linearGradient>
        <filter id="inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
            <feOffset dy="2" dx="2"/>
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff"/>
            <feFlood floodColor="#000" floodOpacity="0.3"/>
            <feComposite in2="shadowDiff" operator="in"/>
            <feComposite in2="SourceGraphic" operator="over"/>
        </filter>
      </defs>
      
      {/* Background Rounded Square */}
      <rect width="120" height="120" rx="20" fill="#0B0F19" />
      <rect width="120" height="120" rx="20" fill="url(#glow)" fillOpacity="0.1" />
      
      {/* Building Structure */}
      <g filter="url(#inner-shadow)">
        <path 
            d="M25 100 L25 50 L60 25 L95 50 L95 100 Z"
            fill="#121826"
            stroke="#00BFFF"
            strokeWidth="1.5"
            strokeOpacity="0.2"
        />
      </g>
      
      {/* Glowing Windows */}
      <rect x="38" y="60" width="8" height="25" fill="#00BFFF" rx="2" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="56" y="60" width="8" height="35" fill="#00BFFF" rx="2" opacity="0.9">
         <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="0.5s"/>
      </rect>
      <rect x="74" y="60" width="8" height="25" fill="#00BFFF" rx="2" opacity="0.8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="1s"/>
      </rect>
      
      {/* Roof Detail */}
      <path 
          d="M60 25 L95 50 L25 50 Z" 
          fill="url(#glow)"
          fillOpacity="0.5"
      />
    </svg>
  );
}
