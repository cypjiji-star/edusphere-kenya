
"use client";

import React, { createContext, useContext, useEffect, ReactNode, Suspense } from "react";
import { onAuthStateChanged, User, Auth } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { app, firestore } from "@/lib/firebase";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NiceError } from "@/components/ui/nice-error";

export type AllowedRole =
  | "developer"
  | "admin"
  | "teacher"
  | "parent"
  | "unknown";

export interface AuthContextType {
  user: User | null;
  role: AllowedRole;
  loading: boolean;
  clientReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lazy-load Firebase Auth
let auth: Auth;

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<AllowedRole>("unknown");
  const [loading, setLoading] = React.useState(true);
  const [clientReady, setClientReady] = React.useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This effect runs only once on the client after initial mount.
    setClientReady(true);
  }, []);

  useEffect(() => {
    // Dynamically import Firebase Auth on the client
    import("firebase/auth").then((firebaseAuth) => {
      auth = firebaseAuth.getAuth(app);

      const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        setUser(authUser);
        if (!authUser) {
          setRole("unknown");
          setLoading(false);
          return;
        }

        // Don't set loading to true here, let the splash screen show from the initial state
        try {
          const devDoc = await getDoc(
            doc(firestore, "developers", authUser.uid),
          );
          if (devDoc.exists()) {
            setRole("developer");
            return;
          }
          
          let schoolId = searchParams.get("schoolId");
          if (schoolId) {
            if (typeof window !== "undefined") {
              window.sessionStorage.setItem("schoolId", schoolId);
            }
          } else {
             if (typeof window !== "undefined") {
                schoolId = window.sessionStorage.getItem("schoolId");
             }
          }


          if (schoolId) {
            const userDocRef = doc(
              firestore,
              "schools",
              schoolId,
              "users",
              authUser.uid,
            );
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setRole(userDocSnap.data().role.toLowerCase() as AllowedRole);
            } else {
              setRole("unknown");
            }
          } else {
            setRole("unknown");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setRole("unknown");
        } finally {
          // Add a small delay to ensure the splash screen animation completes smoothly
          setTimeout(() => setLoading(false), 500);
        }
      });
      return () => unsubscribe();
    });
  }, [pathname, searchParams]);

  return (
    <AuthContext.Provider value={{ user, role, loading, clientReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
        <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  )
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

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
      !pathname.startsWith("/developer-contact") &&
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
