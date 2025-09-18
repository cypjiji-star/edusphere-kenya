
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { logAuditEvent } from '@/lib/audit-log.service';
import { GradingScaleSettings } from './grading-scale-settings';

interface SettingsTabProps {
  schoolId: string;
}

type EditRequest = {
  id: string;
  teacherName: string;
  assessmentTitle: string;
  className: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: Timestamp;
  assessmentId: string;
};

function EditRequestsTab({ schoolId }: { schoolId: string }) {
  const [requests, setRequests] = React.useState<EditRequest[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    const q = query(collection(firestore, `schools/${schoolId}/grade-edit-requests`), orderBy('requestedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EditRequest)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleRequestUpdate = async (requestId: string, assessmentId: string, newStatus: 'approved' | 'denied', requestDetails: EditRequest) => {
    if (!user) {
      toast({ title: 'Authentication Error', variant: 'destructive' });
      return;
    }

    const batch = writeBatch(firestore);

    const requestRef = doc(firestore, `schools/${schoolId}/grade-edit-requests`, requestId);
    batch.update(requestRef, { status: newStatus });

    if (newStatus === 'approved') {
      const assessmentRef = doc(firestore, `schools/${schoolId}/assessments`, assessmentId);
      batch.update(assessmentRef, { status: 'Active' });
    }

    try {
      await batch.commit();
      await logAuditEvent({
        schoolId,
        actionType: 'Academics',
        description: `Grade Edit Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: `Request from ${requestDetails.teacherName} for ${requestDetails.assessmentTitle} (${requestDetails.className}) was ${newStatus}.`,
      });
      toast({ title: `Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`, description: `The teacher has been notified.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Action Failed', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: EditRequest['status']) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">Pending</Badge>;
      case 'approved': return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case 'denied': return <Badge variant="destructive">Denied</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Edit Requests</CardTitle>
        <CardDescription>Review and approve or deny requests from teachers to edit submitted grades.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length > 0 ? requests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.teacherName}</TableCell>
                  <TableCell>{req.assessmentTitle}<br /><span className="text-xs text-muted-foreground">{req.className}</span></TableCell>
                  <TableCell className="text-muted-foreground italic max-w-sm">"{req.reason}"</TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    {req.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="destructive" onClick={() => handleRequestUpdate(req.id, req.assessmentId, 'denied', req)}>Deny</Button>
                        <Button size="sm" onClick={() => handleRequestUpdate(req.id, req.assessmentId, 'approved', req)}>Approve</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No pending edit requests.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsTab({ schoolId }: SettingsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GradingScaleSettings schoolId={schoolId} />
      <EditRequestsTab schoolId={schoolId} />
    </div>
  );
}
