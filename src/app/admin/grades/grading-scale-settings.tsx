
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { logAuditEvent } from '@/lib/audit-log.service';
import { useAuth } from '@/context/auth-context';
import { Loader2, Save, PlusCircle, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

type GradingScaleItem = {
  grade: string;
  min: number;
  max: number;
  isDefault?: boolean;
};

const initialGradingScale: GradingScaleItem[] = [
  { grade: 'A', min: 80, max: 100, isDefault: true },
  { grade: 'A-', min: 75, max: 79, isDefault: true },
  { grade: 'B+', min: 70, max: 74, isDefault: true },
  { grade: 'B', min: 65, max: 69, isDefault: true },
  { grade: 'B-', min: 60, max: 64, isDefault: true },
  { grade: 'C+', min: 55, max: 59, isDefault: true },
  { grade: 'C', min: 50, max: 54, isDefault: true },
  { grade: 'C-', min: 45, max: 49, isDefault: true },
  { grade: 'D+', min: 40, max: 44, isDefault: true },
  { grade: 'D', min: 35, max: 39, isDefault: true },
  { grade: 'D-', min: 30, max: 34, isDefault: true },
  { grade: 'E', min: 0, max: 29, isDefault: true },
];

export function GradingScaleSettings({ schoolId }: { schoolId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gradingScale, setGradingScale] = React.useState<GradingScaleItem[]>(initialGradingScale);
  const [isSavingScale, setIsSavingScale] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubGradingScale = onSnapshot(doc(firestore, `schools/${schoolId}/settings`, 'grading'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().scale) {
        setGradingScale(docSnap.data().scale);
      }
    });
    
    return () => unsubGradingScale();
  }, [schoolId]);

  const handleGradingScaleChange = (index: number, field: 'min' | 'max' | 'grade', value: string) => {
    const newScale = [...gradingScale];
    if (field === 'min' || field === 'max') {
      newScale[index] = { ...newScale[index], [field]: parseInt(value, 10) || 0 };
    } else {
      newScale[index] = { ...newScale[index], [field]: value };
    }
    setGradingScale(newScale);
  };
  
  const handleRemoveRow = (index: number) => {
    const newScale = [...gradingScale];
    newScale.splice(index, 1);
    setGradingScale(newScale);
  }

  const addGradingRow = () => {
    setGradingScale([...gradingScale, { grade: 'New', min: 0, max: 0, isDefault: false }]);
  };

  const handleSaveScale = async () => {
    if (!schoolId || !user) {
      toast({ title: 'School ID missing', variant: 'destructive' });
      return;
    }
    setIsSavingScale(true);
    try {
      const settingsRef = doc(firestore, `schools/${schoolId}/settings`, 'grading');
      await setDoc(settingsRef, { scale: gradingScale }, { merge: true });

      await logAuditEvent({
        schoolId,
        actionType: 'Settings',
        description: 'Grading Scale Updated',
        user: { id: user.uid, name: user.displayName || 'Admin', role: 'Admin' },
        details: 'The school-wide grading scale was modified.',
      });

      toast({
        title: 'Grading Scale Saved',
        description: 'The new grading scale has been applied school-wide.',
      });
    } catch (e) {
      toast({
        title: 'Save Failed',
        description: 'Could not save the new grading scale.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setIsSavingScale(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grading Settings</CardTitle>
        <CardDescription>Configure the grading scale and other academic settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grade</TableHead>
                  <TableHead>Min Score</TableHead>
                  <TableHead>Max Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradingScale.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input
                        value={item.grade}
                        onChange={(e) => handleGradingScaleChange(index, 'grade', e.target.value)}
                        disabled={item.isDefault}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.min}
                        onChange={(e) => handleGradingScaleChange(index, 'min', e.target.value)}
                        disabled={item.isDefault}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.max}
                        onChange={(e) => handleGradingScaleChange(index, 'max', e.target.value)}
                        disabled={item.isDefault}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" disabled={item.isDefault} onClick={() => handleRemoveRow(index)}>
                        <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button onClick={addGradingRow}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Grade
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveScale} disabled={isSavingScale}>
          {isSavingScale ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Scale
        </Button>
      </CardFooter>
    </Card>
  );
}
