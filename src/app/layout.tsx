import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";
import './globals.css';
import { ClientPageLoader } from '@/components/ui/client-page-loader';
import { Suspense } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { SplashScreen } from '@/components/layout/splash-screen';

export const metadata: Metadata = {
  title: 'EduSphere Kenya',
  description: "Empowering Kenya's Future, One School at a Time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SplashScreen />
          <ClientPageLoader />
          <Suspense>{children}</Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
