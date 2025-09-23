"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User, Auth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { app, firestore } from "@/lib/firebase";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NiceError } from "@/components/ui/nice-error";
import { useRouter } from "next/navigation";

/* ------------------------------------------------------------- */
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
/* ------------------------------------------------------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);
let auth: Auth;

/* ============================================================
   Inner provider – calls useSearchParams → MUST be wrapped
   ============================================================ */
function AuthProviderSuspended({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>("unknown");
  const [loading, setLoading] = useState(true);
  const [clientReady, setClientReady] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams(); // ✅ safe: parent is wrapped

  useEffect(() => setClientReady(true), []);

  useEffect(() => {
    import("firebase/auth").then((mod) => {
      auth = mod.getAuth(app);
      const unsub = onAuthStateChanged(auth, async (authUser) => {
        setUser(authUser);
        if (!authUser) {
          setRole("unknown");
          setLoading(false);
          return;
        }
        try {
          // developer override
          const devSnap = await getDoc(doc(firestore, "developers", authUser.uid));
          if (devSnap.exists()) {
            setRole("developer");
            return;
          }

          // school-scoped role
          let schoolId: string | null = searchParams?.get("schoolId");
          if (schoolId) {
            window.sessionStorage.setItem("schoolId", schoolId);
          } else {
            schoolId = window.sessionStorage.getItem("schoolId");
          }

          if (schoolId) {
            const userSnap = await getDoc(
              doc(firestore, "schools", schoolId, "users", authUser.uid),
            );
            setRole(
              userSnap.exists()
                ? (userSnap.data()?.role?.toLowerCase() as AllowedRole)
                : "unknown",
            );
          } else {
            setRole("unknown");
          }
        } catch (e) {
          console.error(e);
          setRole("unknown");
        } finally {
          setTimeout(() => setLoading(false), 500); // splash
        }
      });
      return () => unsub();
    });
  }, [searchParams]);

  return (
    <AuthContext.Provider value={{ user, role, loading, clientReady }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ============================================================
   Public provider – always wrapped in Suspense
   ============================================================ */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AuthProviderSuspended>{children}</AuthProviderSuspended>
    </React.Suspense>
  );
}

/* ============================================================
   Hook
   ============================================================ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ============================================================
   Role-gate component
   ============================================================ */
export function AuthCheck({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole: AllowedRole;
}) {
  const { user, role, loading, clientReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicPaths = ["/login", "/", "/developer-contact", "/developer/create-dev-account"];
    if (!loading && clientReady && !user && !publicPaths.includes(pathname)) {
      router.push("/login");
    }
  }, [loading, clientReady, user, pathname, router]);

  if (loading || !clientReady)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );

  if (!user) {
    const publicPaths = ["/login", "/", "/developer-contact", "/developer/create-dev-account"];
    return publicPaths.includes(pathname) ? <>{children}</> : null;
  }

  const has = role.toLowerCase() === requiredRole.toLowerCase();
  if (role !== "unknown" && !has)
    return (
      <NiceError
        title="Access Denied"
        description={`Your role is "${role}", but this page requires "${requiredRole}".`}
        onDismiss={() => getAuth().signOut().then(() => router.push("/login"))}
      />
    );

  return <>{children}</>;
}

/* lazy-loaded auth helper */
async function getAuth(): Promise<Auth> {
  if (!auth) {
    const mod = await import("firebase/auth");
    auth = mod.getAuth(app);
  }
  return auth;
}