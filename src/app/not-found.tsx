
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/context/auth-context';

function NotFoundContent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
        </Link>
      </Button>
    </div>
  );
}

// Dynamically import AuthProvider to avoid SSR issues during build
const DynamicAuthProvider = dynamic(() => import('@/context/auth-context').then(mod => mod.AuthProvider), { ssr: false });

export default function NotFoundPage() {
    return (
        <DynamicAuthProvider>
            <NotFoundContent />
        </DynamicAuthProvider>
    );
}
