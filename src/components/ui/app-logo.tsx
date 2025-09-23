"use client";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-8 w-8", className)}
      viewBox="0 0 512 512"
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
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur" />
          <feOffset dx="8.5" dy="8.5" />
          <feComposite
            in2="SourceAlpha"
            operator="arithmetic"
            k2="-1"
            k3="1"
            result="shadowDiff"
          />
          <feFlood floodColor="#000" floodOpacity=".3" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <rect width="512" height="512" rx="85" fill="#0B0F19" />
      <rect
        width="512"
        height="512"
        rx="85"
        fill="url(#glow)"
        fillOpacity=".1"
      />

      <g filter="url(#inner-shadow)">
        <path
          d="M106 425 L106 212 L256 106 L406 212 L406 425 Z"
          fill="#121826"
          stroke="#00BFFF"
          strokeWidth="6.3"
          strokeOpacity=".2"
        />
      </g>

      <rect
        x="162"
        y="255"
        width="34"
        height="106"
        fill="#00BFFF"
        rx="8.5"
        opacity=".8"
      >
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="3s"
          repeatCount="indefinite"
        />
      </rect>
      <rect
        x="239"
        y="255"
        width="34"
        height="149"
        fill="#00BFFF"
        rx="8.5"
        opacity=".9"
      >
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="3s"
          repeatCount="indefinite"
          begin="0.5s"
        />
      </rect>
      <rect
        x="316"
        y="255"
        width="34"
        height="106"
        fill="#00BFFF"
        rx="8.5"
        opacity=".8"
      >
        <animate
          attributeName="opacity"
          values="0.6;1;0.6"
          dur="3s"
          repeatCount="indefinite"
          begin="1s"
        />
      </rect>

      <path d="M256 106 L406 212 L106 212 Z" fill="url(#glow)" fillOpacity=".5" />
    </svg>
  );
}
