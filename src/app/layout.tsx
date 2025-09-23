import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/context/auth-context";
import Script from "next/script";
import { ThemeProvider } from "@/context/theme-provider";
import { StatusBarOverlay } from "@/components/layout/status-bar-overlay";
import { MetaTheme } from "@/components/meta-theme";

export const metadata: Metadata = {
  title: "EduSphere Kenya",
  description: "Empowering Kenya's Future, One School at a Time.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f19" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <MetaTheme color="#0b0f19" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense>
              <StatusBarOverlay />
              {children}
            </Suspense>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
        <Script src="/sw-register.js" />
      </body>
    </html>
  );
}
