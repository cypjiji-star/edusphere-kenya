"use client";

import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface NiceErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function NiceError({
  title = "An Error Occurred",
  message,
  onRetry,
}: NiceErrorProps) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="text-center">
        <div className="mx-auto bg-destructive/10 p-3 rounded-full">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <CardTitle className="pt-4 text-destructive">{title}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent className="flex justify-center">
          <Button variant="destructive" onClick={onRetry}>
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
