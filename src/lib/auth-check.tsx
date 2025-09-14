
'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type AllowedRole = 'admin' | 'teacher' | 'parent' | 'developer';

export function AuthCheck({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole: AllowedRole;
}) {
  const searchParams = useSearchParams();
  // In a real app, you would get the user's role from a secure, server-side session,
  // not from the URL. This is for demonstration purposes only.
  const userRole = searchParams.get('role');

  if (userRole === requiredRole) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You are not authorized to view this page. Your role is listed as "{userRole || 'Not Logged In'}", but this page requires the "{requiredRole}" role.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Return to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
