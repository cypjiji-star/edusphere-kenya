"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Loader2,
  UserX,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  limit,
  orderBy,
  Timestamp,
} from "firebase/firestore";

type SecurityAlert = {
  type: "Failed Logins" | "After-Hours Activity" | "Sensitive Change";
  description: string;
  timestamp: Timestamp;
  user?: string;
  details?: string;
};

export function SecurityAlertsWidget({ schoolId }: { schoolId: string }) {
  const [alerts, setAlerts] = React.useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    const logsQuery = query(
      collection(firestore, "schools", schoolId, "audit_logs"),
      where("actionType", "in", ["Security", "Settings"]),
      orderBy("timestamp", "desc"),
      limit(10),
    );

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const securityAlerts: SecurityAlert[] = [];
      const failedLoginAttempts: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const log = doc.data();
        const logTime = log.timestamp.toDate();
        const hour = logTime.getHours();

        if (log.action === "USER_LOGIN_FAILURE") {
          const userIdentifier = log.user.name || "Unknown";
          failedLoginAttempts[userIdentifier] =
            (failedLoginAttempts[userIdentifier] || 0) + 1;
        }

        if (hour < 7 || hour > 19) {
          securityAlerts.push({
            type: "After-Hours Activity",
            description: log.description,
            timestamp: log.timestamp,
            user: log.user.name,
          });
        }

        if (log.action.includes("PERMISSION") || log.action.includes("ROLE")) {
          securityAlerts.push({
            type: "Sensitive Change",
            description: log.description,
            timestamp: log.timestamp,
            user: log.user.name,
          });
        }
      });

      for (const [user, count] of Object.entries(failedLoginAttempts)) {
        if (count > 3) {
          securityAlerts.push({
            type: "Failed Logins",
            description: `${count} failed login attempts for user: ${user}`,
            timestamp: Timestamp.now(),
            user: user,
          });
        }
      }

      // Sort alerts by timestamp
      securityAlerts.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      setAlerts(securityAlerts.slice(0, 4));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [schoolId]);

  const getAlertIcon = (type: SecurityAlert["type"]) => {
    switch (type) {
      case "Failed Logins":
        return <UserX className="h-5 w-5 text-red-500" />;
      case "After-Hours Activity":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "Sensitive Change":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-primary" />
          Security Alerts
        </CardTitle>
        <CardDescription>
          A summary of recent, potentially sensitive activity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{alert.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <ShieldAlert className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No critical security events detected.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          asChild
          variant="outline"
          className="w-full text-primary hover:text-primary"
        >
          <Link href={`/admin/logs?schoolId=${schoolId}`}>
            View Full Audit Log
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
