"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AuthContextType, AllowedRole } from "@/context/auth-context";
import { getAuth } from "firebase/auth";

function AuthChecker({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole: AllowedRole;
}) {
  const { user, role, loading, clientReady } =
    useAuth() as AuthContextType;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (
      !loading &&
      clientReady &&
      !user &&
      pathname !== "/login" &&
      pathname !== "/" &&
      !pathname.startsWith("/developer/create-dev-account")
    ) {
      router.push("/login");
    }
  }, [loading, clientReady, user, pathname, router]);

  if (loading || !clientReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    if (
      pathname === "/login" ||
      pathname === "/" ||
      pathname.startsWith("/developer-contact") ||
      pathname.startsWith("/developer/create-dev-account")
    ) {
      return <>{children}</>;
    }
    return null;
  }

  // Case-insensitive role check
  const hasPermission = role.toLowerCase() === requiredRole.toLowerCase();

  // For non-developer roles, also check if schoolId is present
  if (
    requiredRole !== "developer" &&
    !pathname.startsWith("/developer") &&
    !searchParams.has("schoolId")
  ) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">
          School ID Missing
        </h1>
        <p className="mt-2 text-muted-foreground">
          A school ID is required to access this page. Please log in again.
        </p>
        <Button
          onClick={() =>
            getAuth()
              .signOut()
              .then(() => router.push("/login"))
          }
          variant="outline"
          className="mt-4"
        >
          Logout and Sign In Again
        </Button>
      </div>
    );
  }

  if (role !== "unknown" && !hasPermission) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          Your role is "{role}", but this page requires the "{requiredRole}"
          role.
        </p>
        <Button
          onClick={() =>
            getAuth()
              .signOut()
              .then(() => router.push("/login"))
          }
          variant="outline"
          className="mt-4"
        >
          Logout and Sign In Again
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthCheck({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole: AllowedRole;
}) {
  const validRoles = ["developer", "admin", "teacher", "parent"];
  const normalizedRole = validRoles.includes(requiredRole.toLowerCase())
    ? (requiredRole.toLowerCase() as AllowedRole)
    : "unknown";

  return <AuthChecker requiredRole={normalizedRole}>{children}</AuthChecker>;
}
