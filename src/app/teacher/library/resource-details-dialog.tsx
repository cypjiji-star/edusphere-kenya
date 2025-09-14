
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Star } from 'lucide-react';
import type { Resource } from './types';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';

interface ResourceDetailsDialogProps {
  resource: Resource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResourceDetailsDialog({
  resource,
  open,
  onOpenChange,
}: ResourceDetailsDialogProps) {
  const [formattedDueDate, setFormattedDueDate] = React.useState('');
  const [isRecommended, setIsRecommended] = React.useState(resource?.recommended || false);
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { toast } = useToast();

  React.useEffect(() => {
    if (resource?.status === 'Out' && resource.dueDate) {
      setFormattedDueDate(new Date(resource.dueDate).toLocaleDateString());
    } else {
      setFormattedDueDate('');
    }
    setIsRecommended(resource?.recommended || false);
  }, [resource]);
  
  const handleRecommendationToggle = async (checked: boolean) => {
    if (!resource || !schoolId) return;

    setIsRecommended(checked);
    const resourceRef = doc(firestore, 'schools', schoolId, 'library-resources', resource.id);
    try {
        await updateDoc(resourceRef, { recommended: checked });
        toast({
            title: checked ? 'Resource Recommended' : 'Recommendation Removed',
            description: `"${resource.title}" will ${checked ? 'now' : 'no longer'} be shown as recommended to students.`
        });
    } catch (e) {
        console.error(e);
        toast({ title: 'Update failed', variant: 'destructive'});
        setIsRecommended(!checked); // Revert on failure
    }
  }


  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{resource.title}</DialogTitle>
          <DialogDescription>
            {resource.type} - {resource.subject} - {resource.grade}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 py-4 md:grid-cols-2">
            <div className="space-y-6">
                <div>
                    <h4 className="font-semibold text-primary">Description</h4>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-primary">Author/Publisher</h4>
                    <p className="text-sm text-muted-foreground">{resource.author}</p>
                </div>
                 <div>
                    <h4 className="font-semibold text-primary">Availability</h4>
                    <Badge variant={resource.status === 'Available' || resource.status === 'Digital' ? 'default' : 'destructive'}>{resource.status}</Badge>
                    {resource.status === 'Out' && formattedDueDate && (
                        <p className="text-sm text-muted-foreground">Due back on: {formattedDueDate}</p>
                    )}
                </div>
                <Separator />
                 <div>
                    <h4 className="font-semibold text-primary mb-2">Teacher Actions</h4>
                     <div className="flex items-center space-x-2">
                        <Switch id="recommend-switch" checked={isRecommended} onCheckedChange={handleRecommendationToggle} />
                        <Label htmlFor="recommend-switch" className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            Recommend for Students
                        </Label>
                    </div>
                </div>
            </div>
            <div>
                 <h4 className="font-semibold text-primary mb-2">Digital Preview</h4>
                 <div className="flex aspect-video min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/20">
                    {resource.status === 'Digital' ? (
                        <div className="text-center text-muted-foreground p-4">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-sm font-medium">Digital document preview would be here.</p>
                            <Button variant="outline" size="sm" className="mt-4" disabled>
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                            </Button>
                        </div>
                    ) : (
                         <div className="text-center text-muted-foreground p-4">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-2 text-sm font-medium">No digital version available for preview.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
