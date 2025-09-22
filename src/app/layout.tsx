
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/context/auth-context';
import Script from 'next/script';
import { ThemeProvider } from '@/context/theme-provider';


export const metadata: Metadata = {
  title: 'EduSphere Kenya',
  description: "Empowering Kenya's Future, One School at a Time.",
  manifest: '/manifest.json',
  themeColor: '#8B5CF6',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <Suspense>{children}</Suspense>
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        <Script src="/sw-register.js" />
      </body>
    </html>
  );
}
