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
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* PWA Manifest & Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="https://i.postimg.cc/fWq00L3V/favicon-96x96.png" type="image/png" />
        <link rel="apple-touch-icon" href="https://i.postimg.cc/1zK8R5h5/apple-touch-icon.png" />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
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
