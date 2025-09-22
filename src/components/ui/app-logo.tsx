"use client";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* ① attribute-only → identical string on server & client */}
        <linearGradient id="glow" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#00BFFF" stopOpacity=".8" />
          <stop offset="100%" stopColor="#00BFFF" stopOpacity=".3" />
        </linearGradient>

        <filter id="inner-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feOffset dx="2" dy="2" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#000" floodOpacity=".3" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <rect width="120" height="120" rx="20" fill="#0B0F19" />
      <rect width="120" height="120" rx="20" fill="url(#glow)" fillOpacity=".1" />

      <g filter="url(#inner-shadow)">
        <path
          d="M25 100 L25 50 L60 25 L95 50 L95 100 Z"
          fill="#121826"
          stroke="#00BFFF"
          strokeWidth="1.5"
          strokeOpacity=".2"
        />
      </g>

      <rect x="38" y="60" width="8" height="25" fill="#00BFFF" rx="2" opacity=".8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
      </rect>
      <rect x="56" y="60" width="8" height="35" fill="#00BFFF" rx="2" opacity=".9">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" begin="0.5s" />
      </rect>
      <rect x="74" y="60" width="8" height="25" fill="#00BFFF" rx="2" opacity=".8">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" begin="1s" />
      </rect>

      <path d="M60 25 L95 50 L25 50 Z" fill="url(#glow)" fillOpacity=".5" />
    </svg>
  );
}