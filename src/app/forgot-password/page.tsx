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
import { Loader2, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsSent(false);

    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Check Your Email",
        description: `A password reset link has been sent to ${email}.`,
      });
      setIsSent(true);
    } catch (error: any) {
      let errorMessage = "An error occurred. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage =
          "This email is not registered. Please check the address and try again.";
      }
      toast({
        title: "Request Failed",
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
            Reset Your Password
          </h1>
          <p className="text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {isSent ? (
              <div className="text-center p-4">
                <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold">Email Sent!</h3>
                <p className="text-muted-foreground mt-2">
                  Please check your inbox (and spam folder) for a link to reset
                  your password.
                </p>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex-col items-center gap-4">
            <div className="text-center text-sm">
              Remembered your password?{" "}
              <Link href="/login" className="underline">
                Back to Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
