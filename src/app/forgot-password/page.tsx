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
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ShieldQuestion } from "lucide-react";
import Link from "next/link";
import { getAuth } from "firebase/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();

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
            Password Assistance
          </h1>
          <p className="text-muted-foreground">
            Get help with accessing your account.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="p-4">
              <ShieldQuestion className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold">Contact Your School</h3>
              <p className="text-muted-foreground mt-2">
                For security reasons, password resets must be handled by your
                school's administrator. Please contact your school office for
                assistance with resetting your password.
              </p>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
