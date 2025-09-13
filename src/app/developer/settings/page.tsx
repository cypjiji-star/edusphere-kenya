'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ArrowRight, Code, Database, UserCheck, Globe, FileClock, Hourglass, Webhook, Flag, AlertCircle, GitBranch } from 'lucide-react';
import Link from 'next/link';

const devTools = [
  {
    icon: Code,
    title: 'API Explorer',
    description: 'View all available REST & GraphQL endpoints and test API calls directly.',
  },
  {
    icon: Database,
    title: 'Firestore Schema Viewer',
    description: 'Visualize your Firestore collections, documents, and applied security rules.',
  },
  {
    icon: UserCheck,
    title: 'Role & Claims Manager',
    description: 'Create and edit custom roles (teacher, parent, security) and assign permissions.',
  },
  {
    icon: Globe,
    title: 'Subdomain & Tenant Manager',
    description: 'Add/edit school tenants and manage custom subdomains and branding.',
  },
  {
    icon: FileClock,
    title: 'Audit & Logs Viewer',
    description: 'View security logs (logins, edits) and filter them by user, module, or date.',
  },
  {
    icon: Hourglass,
    title: 'Event & Cron Job Monitor',
    description: 'Monitor scheduled background tasks like reports and notifications.',
  },
  {
    icon: Webhook,
    title: 'Webhook & Integration Sandbox',
    description: 'Register and test external integrations like payment gateways and AI bots.',
  },
  {
    icon: Flag,
    title: 'Feature Flags & Experiments',
    description: 'Enable or disable experimental features and manage gradual rollouts per tenant.',
  },
  {
    icon: AlertCircle,
    title: 'Error Tracking & Debug Console',
    description: 'Collect front-end and back-end errors, view stack traces, and debug issues.',
  },
  {
    icon: GitBranch,
    title: 'Deployment & Version Control',
    description: 'View deployed versions for each school and manage rollbacks or changelogs.',
  },
];


export default function DeveloperSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-primary" />
          Developer Settings & Tools
        </h1>
        <p className="text-muted-foreground">Advanced tools for platform management, debugging, and tenant configuration.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devTools.map((tool) => (
          <Card key={tool.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <tool.icon className="h-6 w-6 text-primary" />
                {tool.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="outline" disabled>
                Manage
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
