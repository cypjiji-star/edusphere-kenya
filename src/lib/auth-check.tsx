"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AuthContextType, AllowedRole } from "@/context/auth-context";
import { getAuth } from "firebase/auth";
import { NiceError } from "@/components/ui/nice-error";

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
      <NiceError
        title="School ID Missing"
        description="A school ID is required to access this page. Please log in again through your school's portal."
        onDismiss={() =>
          getAuth()
            .signOut()
            .then(() => router.push("/login"))
        }
      />
    );
  }

  if (role !== "unknown" && !hasPermission) {
    return (
      <NiceError
        title="Access Denied"
        description={`Your role is "${role}", but this page requires the "${requiredRole}" role.`}
        onDismiss={() =>
          getAuth()
            .signOut()
            .then(() => router.push("/login"))
        }
      />
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
