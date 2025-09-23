"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { firestore } from "@/lib/firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function DeveloperLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const devDocRef = doc(firestore, "developers", user.uid);
      const devDocSnap = await getDoc(devDocRef);

      if (devDocSnap.exists()) {
        router.push("/developer");
      } else {
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: "You are not registered as a developer.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: "Please check your email and password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleLogin}>
      <div className="grid gap-2">
        <Label htmlFor="dev-email">Developer Email</Label>
        <Input
          id="dev-email"
          type="email"
          placeholder="dev@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="dev-password">Password</Label>
        <Input
          id="dev-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Developer Login
      </Button>

      <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/developer/create-dev-account" className="underline">
          Sign up as a developer
        </Link>
      </div>
    </form>
  );
}
