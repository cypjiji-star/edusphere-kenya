import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  // Setting a simple background color for the splash screen
  // to make the transition to the app's animated splash screen seamless.
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/offline",
  },
  cacheStartUrl: true,
  dynamicStartUrl: true,
  generatemanifest: true,
  manifest: {
    name: "EduSphere Kenya",
    short_name: "EduSphere",
    description: "Empowering Kenya's Future, One School at a Time.",
    background_color: "#0B0F19",
    theme_color: "#0B0F19",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // ✅ Recommended for stability
  reactStrictMode: true,

  // ✅ Ignore type + lint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Re-enable Next.js image optimization
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Transpile specific packages to fix module format errors
  transpilePackages: ["jspdf", "jspdf-autotable"],
};

export default withPWA(nextConfig);
