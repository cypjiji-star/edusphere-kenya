
'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { FileClock, UserPlus, ShieldCheck, CircleDollarSign, Settings, Search, Filter, CalendarIcon, ChevronDown, FileDown, ArrowRight, Fingerprint, Laptop, FileText, RefreshCw, HeartPulse, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';


type ActionType = 'User Management' | 'Finance' | 'Academics' | 'Settings' | 'Security' | 'Health' | 'General';

type AuditLog = {
  id: string;
  action: string;
  actionType: ActionType;
  description: string;
  user: {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
  };
  timestamp: Timestamp;
  details: string | { oldValue: string | null; newValue: string };
  ipAddress?: string;
  userAgent?: string;
};

const actionTypeConfig: Record<ActionType, { icon: React.ElementType, color: string }> = {
    'User Management': { icon: UserPlus, color: 'text-blue-500' },
    'Finance': { icon: CircleDollarSign, color: 'text-green-500' },
    'Academics': { icon: FileText, color: 'text-purple-500' },
    'Settings': { icon: Settings, color: 'text-orange-500' },
    'Security': { icon: ShieldCheck, color: 'text-red-500' },
    'Health': { icon: HeartPulse, color: 'text-pink-500' },
    'General': { icon: FileClock, color: 'text-gray-500' },
}

const actionTypes: (ActionType | 'All Types')[] = ['All Types', 'User Management', 'Finance', 'Academics', 'Settings', 'Security', 'Health'];

export default function AuditLogsPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [userFilter, setUserFilter] = React.useState('All Users');
  const [users, setUsers] = React.useState<string[]>(['All Users', 'System']);
  const [actionFilter, setActionFilter] = React.useState<ActionType | 'All Types'>('All Types');
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  React.useEffect(() => {
    if (!schoolId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);

    const usersQuery = query(collection(firestore, `schools/${schoolId}/users`));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
        const userNames = new Set<string>(['All Users', 'System']);
        snapshot.forEach(doc => userNames.add(doc.data().name));
        setUsers(Array.from(userNames));
    });

    const logsQuery = query(collection(firestore, `schools/${schoolId}/audit_logs`), orderBy('timestamp', 'desc'));
    
    let unsubscribeLogs = () => {};

    const fetchData = () => {
      unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
          setLogs(fetchedLogs);
          setIsLoading(false);
      }, (error) => {
          console.error("Error fetching audit logs: ", error);
          setIsLoading(false);
      });
    };

    if (autoRefresh) {
        fetchData();
    } else {
        setIsLoading(false); // No initial fetch if auto-refresh is off
    }

    return () => {
      unsubUsers();
      unsubscribeLogs();
    };
  }, [schoolId, autoRefresh]);

  const filteredLogs = logs.filter(log => {
      const recordDate = log.timestamp?.toDate();
      if (!recordDate) return false;

      const isDateInRange = date?.from && date?.to ? recordDate >= date.from && recordDate <= date.to : true;
      const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (typeof log.details === 'string' && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesUser = userFilter === 'All Users' || log.user.name === userFilter;
      const matchesAction = actionFilter === 'All Types' || log.actionType === actionFilter;

      return isDateInRange && matchesSearch && matchesUser && matchesAction;
  });

  if (!schoolId) {
    return <div className="p-8">Error: School ID is missing.</div>
  }

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedLog(null)}>
        <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <FileClock className="h-8 w-8 text-primary"/>
                Audit Log
            </h1>
            <p className="text-muted-foreground">Track important activities and changes within the portal. Access is restricted to authorized personnel.</p>
        </div>

        <Card>
                <CardHeader>
                    <CardTitle>System Activity Feed</CardTitle>
                    <CardDescription>A detailed log of all key actions performed in the system.</CardDescription>
                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search logs..."
                                    className="w-full bg-background pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex w-full flex-wrap gap-2 md:w-auto md:flex-row md:items-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filters
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="p-4 space-y-4 w-64">
                                        <div>
                                            <Label className="text-sm font-medium">User</Label>
                                            <Select value={userFilter} onValueChange={setUserFilter}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium">Action Type</Label>
                                            <Select value={actionFilter} onValueChange={(v: ActionType | 'All Types') => setActionFilter(v)}>
                                                <SelectTrigger><SelectValue/></SelectTrigger>
                                                <SelectContent>
                                                    {actionTypes.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Popover>
                                    <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal md:w-auto lg:min-w-[250px]', !date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                        date.to ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}` : format(date.from, 'LLL dd, y')
                                        ) : <span>Pick a date range</span>}
                                    </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                                    </PopoverContent>
                                </Popover>
                                <Separator orientation="vertical" className="h-10 hidden md:block" />
                                 <div className="flex items-center gap-2">
                                     <Button variant="outline" size="icon" onClick={() => setIsLoading(true)}>
                                        <RefreshCw className="h-4 w-4" />
                                     </Button>
                                     <div className="flex items-center space-x-2">
                                        <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh}/>
                                        <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">Auto-refresh</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="flex h-64 items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="w-full overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Action</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Details</TableHead>
                                        <TableHead className="text-right">View</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLogs.length > 0 ? (
                                        filteredLogs.map((log) => {
                                            const config = actionTypeConfig[log.actionType];
                                            const Icon = config.icon;
                                            return (
                                                <DialogTrigger key={log.id} asChild>
                                                    <TableRow 
                                                    onClick={() => setSelectedLog(log)} 
                                                    className={cn(
                                                        "cursor-pointer",
                                                        log.actionType === 'Security' && 'border-l-4 border-destructive'
                                                    )}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Icon className={cn("h-5 w-5", config.color)} />
                                                                <span className="font-mono text-xs">{log.action}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={log.user.avatarUrl} alt={log.user.name} />
                                                                    <AvatarFallback>{log.user.name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium">{log.user.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{log.user.role}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {log.timestamp?.toDate().toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                                            {log.description}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="sm">
                                                                Details <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                </DialogTrigger>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                            No log entries found for the selected filters.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{filteredLogs.length}</strong> of <strong>{logs.length}</strong> total records.
                    </div>
                </CardFooter>
            </Card>
        </div>
         {selectedLog && (
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                         <FileClock className="h-6 w-6 text-primary"/>
                        Log Entry Details
                    </DialogTitle>
                    <DialogDescription>
                        A detailed snapshot of the action performed.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-1">
                        <h4 className="font-semibold">{selectedLog.description}</h4>
                        <div className="text-sm text-muted-foreground">Action Type: <Badge variant="outline">{selectedLog.action}</Badge></div>
                    </div>

                    <Separator />
                    
                    {typeof selectedLog.details === 'object' && selectedLog.details !== null ? (
                        <div className="space-y-4">
                            <h4 className="font-semibold">Changes</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm p-4 border rounded-lg bg-muted/50">
                                <div>
                                    <h5 className="text-muted-foreground font-medium mb-2">Before</h5>
                                    <p className="font-mono bg-background p-2 rounded-md break-words">{selectedLog.details.oldValue || 'N/A (New Record)'}</p>
                                </div>
                                <div>
                                    <h5 className="text-muted-foreground font-medium mb-2">After</h5>
                                    <p className="font-mono bg-background p-2 rounded-md break-words">{selectedLog.details.newValue}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <h4 className="font-semibold">Details</h4>
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">{selectedLog.details}</p>
                        </div>
                    )}
                    
                    <Separator />

                     <div className="space-y-4">
                        <h4 className="font-semibold">Metadata</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-start gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={selectedLog.user.avatarUrl} />
                                    <AvatarFallback>{selectedLog.user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-muted-foreground">Performed By</p>
                                    <p className="font-medium">{selectedLog.user.name} ({selectedLog.user.role})</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-2">
                                <CalendarIcon className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                                <div>
                                    <p className="text-muted-foreground">Timestamp</p>
                                    <p className="font-medium">{selectedLog.timestamp?.toDate().toLocaleString()}</p>
                                </div>
                            </div>
                            {selectedLog.ipAddress && (
                                <div className="flex items-start gap-2">
                                    <Fingerprint className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                                    <div>
                                        <p className="text-muted-foreground">IP Address</p>
                                        <p className="font-medium">{selectedLog.ipAddress}</p>
                                    </div>
                                </div>
                            )}
                             {selectedLog.userAgent && (
                                <div className="flex items-start gap-2">
                                    <Laptop className="h-5 w-5 mt-0.5 text-muted-foreground"/>
                                    <div>
                                        <p className="text-muted-foreground">Device/Browser</p>
                                        <p className="font-medium">{selectedLog.userAgent}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
         )}
    </Dialog>
  );
}
