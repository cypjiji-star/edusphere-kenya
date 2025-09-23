"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { createDeveloperUserAction } from "../actions";

export default function CreateDeveloperAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createDeveloperUserAction({ email, password });

      if (result.success) {
        toast({
          title: "Account Created",
          description: "You have been registered as a developer.",
        });
        // Firebase Auth will automatically sign the user in.
        // We can redirect them to the developer dashboard.
        router.push("/developer");
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      // Firebase error codes are often in the message from the server action
      if (error.message.includes("auth/email-already-in-use")) {
        errorMessage =
          "This email address is already in use by another account.";
      } else if (error.message.includes("auth/weak-password")) {
        errorMessage =
          "The password is too weak. It must be at least 6 characters long.";
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2 mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="font-bold font-headline text-2xl">
              EduSphere Kenya
            </span>
          </Link>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Developer Registration
          </h1>
          <p className="text-muted-foreground">
            Create your super admin account
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSignUp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dev@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="Must be at least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Developer Account
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
