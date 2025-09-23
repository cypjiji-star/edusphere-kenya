"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
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
import { usePathname } from "next/navigation";
import { SplashScreen } from "@/components/layout/splash-screen";
import { ClientPageLoader } from "@/components/ui/client-page-loader";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [role, setRole] = React.useState<AllowedRole>("unknown");
  const [loading, setLoading] = React.useState(true);
  const [clientReady, setClientReady] = React.useState(false);
  const pathname = usePathname();

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

        setLoading(true);
        try {
          const devDoc = await getDoc(
            doc(firestore, "developers", authUser.uid),
          );
          if (devDoc.exists()) {
            setRole("developer");
            return;
          }

          // Role determination for other users now happens inside layouts
          // that have access to schoolId. For now, we can set a general
          // authenticated state and let layouts refine the role.
          const schoolId =
            typeof window !== "undefined"
              ? window.sessionStorage.getItem("schoolId")
              : null;

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
              setRole(userDocSnap.data().role as AllowedRole);
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
          setLoading(false);
        }
      });
      return () => unsubscribe();
    });
  }, [pathname]);

  return (
    <AuthContext.Provider value={{ user, role, loading, clientReady }}>
      <SplashScreen />
      <ClientPageLoader />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
