"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import * as React from "react";
import Link from "next/link";
import { firestore } from "@/lib/firebase";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logAuditEvent } from "@/lib/audit-log.service";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [role, setRole] = React.useState("admin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [schoolId, setSchoolId] = React.useState(searchParams.get("schoolId") || "");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!schoolId) {
      toast({
        title: "School ID Required",
        description: "Please enter your school's unique ID to log in.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const userDocRef = doc(firestore, "schools", schoolId, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (
        userDocSnap.exists() &&
        userDocSnap.data().role?.toLowerCase() === role.toLowerCase()
      ) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("schoolId", schoolId);
        }
        await updateDoc(userDocRef, { lastLogin: serverTimestamp() }).catch(
          () => {},
        );
        await logAuditEvent({
          schoolId,
          action: "USER_LOGIN_SUCCESS",
          actionType: "Security",
          description: `User ${user.email} successfully logged in as ${role}.`,
          user: { id: user.uid, name: userDocSnap.data().name, role },
        });
        router.push(`/${role}?schoolId=${schoolId}`);
      } else {
        await auth.signOut();
        toast({
          title: "Access Denied",
          description: `Your credentials are correct, but you do not have the "${role}" role for this school.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      let title = "Login Failed";
      let description = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          title = "Invalid Credentials";
          description = "The email or password you entered is incorrect.";
          break;
        default:
          description = "Please check your credentials and school ID.";
          break;
      }

      await logAuditEvent({
        schoolId: schoolId || "unknown",
        action: "USER_LOGIN_FAILURE",
        actionType: "Security",
        description: `Failed login attempt for ${email}.`,
        user: { id: "unknown", name: email, role: "unknown" },
        details: `Reason: ${description}`,
      });

      toast({ title, description, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleLogin}>
      <div className="grid gap-2">
        <Label htmlFor="schoolId">School ID</Label>
        <Input
          id="schoolId"
          type="text"
          placeholder="Enter your school's unique ID"
          required
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary underline"
          >
            Forgot your password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="role">Login as</Label>
        <Select value={role} onValueChange={setRole} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Login as..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Login
      </Button>
    </form>
  );
}
