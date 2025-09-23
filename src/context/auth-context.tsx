
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Suspense,
} from "react";
import { onAuthStateChanged, User, Auth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { app, firestore } from "@/lib/firebase";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { NiceError } from "@/components/ui/nice-error";
import { useRouter } from "next/navigation";

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

/* ---------- lazy-loaded Firebase Auth instance ---------- */
let auth: Auth;

/* ---------- tiny component that *actually* touches the URL ---------- */
function SchoolIdHandler({
  setSchoolId,
}: {
  setSchoolId: (id: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/404" || pathname === "/_not-found") {
      setSchoolId(null);
      return;
    }
    let schoolId = searchParams?.get("schoolId");
    if (schoolId) {
      window.sessionStorage.setItem("schoolId", schoolId);
    } else {
      schoolId = window.sessionStorage.getItem("schoolId");
    }
    setSchoolId(schoolId);
  }, [searchParams, pathname, setSchoolId]);

  return null;
}

/* ---------- real provider logic ---------- */
function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AllowedRole>("unknown");
  const [loading, setLoading] = useState(true);
  const [clientReady, setClientReady] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setClientReady(true);
  }, []);

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
          const devSnap = await getDoc(
            doc(firestore, "developers", authUser.uid),
          );
          if (devSnap.exists()) {
            setRole("developer");
            return;
          }

          // school-scoped role
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
          setTimeout(() => setLoading(false), 500); // splash animation
        }
      });
      return () => unsub();
    });
  }, [schoolId]);

  return (
    <AuthContext.Provider value={{ user, role, loading, clientReady }}>
      {/* boundary keeps useSearchParams away from static render */}
      <Suspense fallback={null}>
        <SchoolIdHandler setSchoolId={setSchoolId} />
      </Suspense>
      {children}
    </AuthContext.Provider>
  );
}

/* ---------- public provider ---------- */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <AuthProviderInner>{children}</AuthProviderInner>
    </Suspense>
  );
}

/* ---------- helper hook ---------- */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ---------- role-gate component ---------- */
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
    if (
      !loading &&
      clientReady &&
      !user &&
      !["/login", "/", "/developer-contact", "/developer/create-dev-account"].includes(pathname)
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
    const allow = ["/login", "/", "/developer-contact", "/developer/create-dev-account"];
    return allow.includes(pathname) ? <>{children}</> : null;
  }

  const has = role.toLowerCase() === requiredRole.toLowerCase();
  if (role !== "unknown" && !has) {
    return (
      <NiceError
        title="Access Denied"
        description={`Your role is "${role}", but this page requires "${requiredRole}".`}
        onDismiss={() => getAuth().signOut().then(() => router.push("/login"))}
      />
    );
  }

  return <>{children}</>;
}
