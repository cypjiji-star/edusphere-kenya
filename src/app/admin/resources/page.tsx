
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, PlusCircle, Search, Trash2, Edit, TrendingDown, Loader2, FileText } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type ResourceItem = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    initialQuantity: number;
    unit: string;
    responsiblePersonId: string;
    responsiblePersonName: string;
};

type UsageLog = {
    id: string;
    resourceId: string;
    resourceName: string;
    quantityUsed: number;
    date: any;
    notes: string;
    recordedBy: string;
};

type Teacher = {
    id: string;
    name: string;
};

const resourceCategories = ['Foodstuff', 'Stationery', 'Electronics', 'Cleaning Supplies', 'Furniture', 'Sports Equipment', 'Medical Supplies'];
const resourceUnits = ['units', 'kg', 'litres', 'bags', 'boxes', 'pieces', 'reams'];

export default function ResourcesPage() {
    const searchParams = useSearchParams();
    const schoolId = searchParams.get('schoolId');
    const { user } = useAuth();
    const { toast } = useToast();

    const [resources, setResources] = React.useState<ResourceItem[]>([]);
    const [usageLogs, setUsageLogs] = React.useState<UsageLog[]>([]);
    const [allTeachers, setAllTeachers] = React.useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Form states
    const [newItemName, setNewItemName] = React.useState('');
    const [newItemCategory, setNewItemCategory] = React.useState('');
    const [newItemQuantity, setNewItemQuantity] = React.useState('');
    const [newItemUnit, setNewItemUnit] = React.useState('');
    const [newItemResponsible, setNewItemResponsible] = React.useState('');
    const [isNewItemDialogOpen, setIsNewItemDialogOpen] = React.useState(false);
    
    // Usage dialog states
    const [usageResource, setUsageResource] = React.useState<ResourceItem | null>(null);
    const [usageQuantity, setUsageQuantity] = React.useState('');
    const [usageNotes, setUsageNotes] = React.useState('');

    React.useEffect(() => {
        if (!schoolId) {
            setIsLoading(false);
            return;
        }

        const resourcesQuery = query(collection(firestore, `schools/${schoolId}/resources`));
        const unsubResources = onSnapshot(resourcesQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceItem));
            setResources(items);
            setIsLoading(false);
        });
        
        const usageQuery = query(collection(firestore, `schools/${schoolId}/resource_usage`), serverTimestamp());
        const unsubUsage = onSnapshot(usageQuery, (snapshot) => {
            const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsageLog));
            setUsageLogs(logs);
        });

        const teachersQuery = query(collection(firestore, `schools/${schoolId}/teachers`));
        const unsubTeachers = onSnapshot(teachersQuery, (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setAllTeachers(teachersData);
        });

        return () => {
            unsubResources();
            unsubUsage();
            unsubTeachers();
        }
    }, [schoolId]);

    const handleCreateResource = async () => {
        if (!newItemName || !newItemCategory || !newItemQuantity || !newItemUnit || !newItemResponsible || !schoolId || !user) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);
        try {
            const responsibleTeacher = allTeachers.find(t => t.id === newItemResponsible);

            await addDoc(collection(firestore, `schools/${schoolId}/resources`), {
                name: newItemName,
                category: newItemCategory,
                quantity: Number(newItemQuantity),
                initialQuantity: Number(newItemQuantity),
                unit: newItemUnit,
                responsiblePersonId: newItemResponsible,
                responsiblePersonName: responsibleTeacher?.name || 'Unknown',
                createdAt: serverTimestamp(),
            });

            toast({ title: 'Resource Added', description: `${newItemName} has been added to the inventory.` });
            setNewItemName('');
            setNewItemCategory('');
            setNewItemQuantity('');
            setNewItemUnit('');
            setNewItemResponsible('');
            setIsNewItemDialogOpen(false);
        } catch (error) {
            console.error("Error adding resource:", error);
            toast({ title: 'Creation Failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRecordUsage = async () => {
        if (!usageResource || !usageQuantity || !usageNotes || !schoolId || !user) {
            toast({ title: 'Missing Information', variant: 'destructive' });
            return;
        }
        
        const quantityUsed = Number(usageQuantity);
        if (quantityUsed > usageResource.quantity) {
             toast({ title: 'Insufficient Stock', description: 'Cannot use more than what is available.', variant: 'destructive' });
             return;
        }

        setIsSubmitting(true);
        const resourceRef = doc(firestore, `schools/${schoolId}/resources`, usageResource.id);

        try {
            await runTransaction(firestore, async (transaction) => {
                const resourceDoc = await transaction.get(resourceRef);
                if (!resourceDoc.exists()) {
                    throw "Resource does not exist!";
                }

                const newQuantity = resourceDoc.data().quantity - quantityUsed;
                transaction.update(resourceRef, { quantity: newQuantity });
                
                const usageLogRef = doc(collection(firestore, `schools/${schoolId}/resource_usage`));
                transaction.set(usageLogRef, {
                    resourceId: usageResource.id,
                    resourceName: usageResource.name,
                    quantityUsed,
                    notes: usageNotes,
                    date: serverTimestamp(),
                    recordedBy: user.displayName || 'Admin',
                });
            });

            toast({ title: 'Usage Recorded', description: `${quantityUsed} ${usageResource.unit} of ${usageResource.name} used.` });
            setUsageResource(null);
            setUsageQuantity('');
            setUsageNotes('');
        } catch (error) {
            console.error("Error recording usage:", error);
            toast({ title: 'Transaction Failed', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary"/></div>;
    }
    
    if (!schoolId) {
        return <div className="p-8">Error: School ID missing from URL.</div>
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                        <Package className="h-8 w-8 text-primary" />
                        Resources & Inventory
                    </h1>
                    <p className="text-muted-foreground">Manage school assets, stock levels, and usage.</p>
                </div>
                <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2"/>
                            Add New Resource
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Resource Item</DialogTitle>
                            <DialogDescription>Add a new item to the school's inventory.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Item Name</Label>
                                    <Input placeholder="e.g., Maize Flour" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                        <SelectContent>{resourceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Initial Quantity</Label>
                                    <Input type="number" placeholder="e.g., 50" value={newItemQuantity} onChange={(e) => setNewItemQuantity(e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit of Measure</Label>
                                    <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                                        <SelectTrigger><SelectValue placeholder="Select..."/></SelectTrigger>
                                        <SelectContent>{resourceUnits.map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Person Responsible</Label>
                                <Select value={newItemResponsible} onValueChange={setNewItemResponsible}>
                                    <SelectTrigger><SelectValue placeholder="Select a staff member..."/></SelectTrigger>
                                    <SelectContent>{allTeachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                            <Button onClick={handleCreateResource} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Item
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            
            <Tabs defaultValue="inventory">
                <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="inventory">Inventory List</TabsTrigger>
                    <TabsTrigger value="usage_log">Usage Log</TabsTrigger>
                </TabsList>
                <TabsContent value="inventory" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Inventory</CardTitle>
                            <CardDescription>An overview of all school resources and current stock levels.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Current Quantity</TableHead>
                                            <TableHead>Responsible Person</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resources.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell><Badge variant="secondary">{item.category}</Badge></TableCell>
                                                <TableCell>{item.quantity} {item.unit}</TableCell>
                                                <TableCell>{item.responsiblePersonName}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => setUsageResource(item)}>
                                                        <TrendingDown className="mr-2 h-4 w-4"/>
                                                        Record Usage
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="usage_log" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Usage Log</CardTitle>
                            <CardDescription>A chronological record of all resource consumption.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="w-full overflow-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Quantity Used</TableHead>
                                            <TableHead>Recorded By</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usageLogs.map(log => (
                                            <TableRow key={log.id}>
                                                <TableCell>{log.date?.toDate().toLocaleString()}</TableCell>
                                                <TableCell>{log.resourceName}</TableCell>
                                                <TableCell>{log.quantityUsed}</TableCell>
                                                <TableCell>{log.recordedBy}</TableCell>
                                                <TableCell>{log.notes}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Dialog open={!!usageResource} onOpenChange={(open) => !open && setUsageResource(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Usage for: {usageResource?.name}</DialogTitle>
                        <DialogDescription>Current quantity: {usageResource?.quantity} {usageResource?.unit}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Quantity Used</Label>
                            <Input type="number" placeholder="e.g., 5" value={usageQuantity} onChange={e => setUsageQuantity(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes / Reason</Label>
                            <Textarea placeholder="e.g., For Form 2 lunch preparation" value={usageNotes} onChange={e => setUsageNotes(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleRecordUsage} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Usage
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
