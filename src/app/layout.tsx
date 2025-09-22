
import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { Suspense } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { SplashScreen } from '@/components/layout/splash-screen';
import Script from 'next/script';
import { ThemeProvider } from '@/context/theme-provider';
import dynamic from 'next/dynamic';

const ClientPageLoader = dynamic(() => import('@/components/ui/client-page-loader').then(mod => mod.ClientPageLoader), {
  ssr: false,
});


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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
          <AuthProvider>
            <SplashScreen />
            <ClientPageLoader />
            <Suspense>{children}</Suspense>
            <Toaster />
          </AuthProvider>
        <Script src="/sw-register.js" />
      </body>
    </html>
  );
}
