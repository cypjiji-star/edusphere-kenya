
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
import { Calendar } from '@/components/ui/calendar';
import { FileClock, UserPlus, ShieldCheck, CircleDollarSign, Settings, Search, Filter, CalendarIcon, ChevronDown, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'User Management' | 'Finance' | 'Academics' | 'Settings' | 'Security';

type AuditLog = {
  id: string;
  actionType: ActionType;
  description: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  timestamp: string;
  details: string;
};

const mockLogs: AuditLog[] = [
    { id: 'log-1', actionType: 'Settings', description: 'Updated school phone number', user: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100' }, timestamp: '2024-07-28T11:00:00Z', details: 'Value changed to +254 722 123 456' },
    { id: 'log-2', actionType: 'User Management', description: 'Created new user account', user: { name: 'Admin User', avatarUrl: 'https://picsum.photos/seed/admin-avatar/100' }, timestamp: '2024-07-28T10:15:00Z', details: 'User: new.teacher@school.ac.ke, Role: Teacher' },
    { id: 'log-3', actionType: 'Finance', description: 'Generated Term 2 invoices', user: { name: 'Finance Officer', avatarUrl: 'https://picsum.photos/seed/finance-officer/100' }, timestamp: '2024-07-27T14:30:00Z', details: 'Applied to all students' },
    { id: 'log-4', actionType: 'Security', description: 'User login failed (3 attempts)', user: { name: 'System', avatarUrl: 'https://picsum.photos/seed/system/100' }, timestamp: '2024-07-27T12:00:00Z', details: 'IP: 203.0.113.1, User: unknown@example.com' },
    { id: 'log-5', actionType: 'Academics', description: 'Published grades for Form 4 Chemistry', user: { name: 'Ms. Wanjiku', avatarUrl: 'https://picsum.photos/seed/teacher-wanjiku/100' }, timestamp: '2024-07-26T16:00:00Z', details: 'Exam: Mid-Term Exam' },
];

const actionTypeConfig: Record<ActionType, { icon: React.ElementType, color: string }> = {
    'User Management': { icon: UserPlus, color: 'text-blue-500' },
    'Finance': { icon: CircleDollarSign, color: 'text-green-500' },
    'Academics': { icon: FileText, color: 'text-purple-500' },
    'Settings': { icon: Settings, color: 'text-orange-500' },
    'Security': { icon: ShieldCheck, color: 'text-red-500' },
}

const users = ['All Users', 'Admin User', 'Finance Officer', 'Ms. Wanjiku', 'System'];
const actionTypes: (ActionType | 'All Types')[] = ['All Types', 'User Management', 'Finance', 'Academics', 'Settings', 'Security'];

export default function AuditLogsPage() {
  const [date, setDate] = React.useState<DateRange | undefined>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [userFilter, setUserFilter] = React.useState('All Users');
  const [actionFilter, setActionFilter] = React.useState<ActionType | 'All Types'>('All Types');
  const [clientReady, setClientReady] = React.useState(false);

  React.useEffect(() => {
    setClientReady(true);
  }, []);

  const filteredLogs = mockLogs.filter(log => {
      const recordDate = new Date(log.timestamp);
      const isDateInRange = date?.from && date?.to ? recordDate >= date.from && recordDate <= date.to : true;
      const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) || log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUser = userFilter === 'All Users' || log.user.name === userFilter;
      const matchesAction = actionFilter === 'All Types' || log.actionType === actionFilter;

      return isDateInRange && matchesSearch && matchesUser && matchesAction;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <FileClock className="h-8 w-8 text-primary"/>
            Audit Log
        </h1>
        <p className="text-muted-foreground">Track important activities and changes within the portal.</p>
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
                         <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
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
                                        <label className="text-sm font-medium">User</label>
                                        <Select value={userFilter} onValueChange={setUserFilter}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>
                                                {users.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Action Type</label>
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
                                    className={cn('w-full justify-start text-left font-normal md:w-[300px]', !date && 'text-muted-foreground')}
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

                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="w-full md:w-auto">
                                        Export
                                        <ChevronDown className="ml-2 h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem disabled><FileDown className="mr-2" />Export as PDF</DropdownMenuItem>
                                    <DropdownMenuItem disabled><FileDown className="mr-2" />Export as CSV</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {userFilter !== 'All Users' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setUserFilter('All Users')}>User: {userFilter} &times;</Badge>}
                        {actionFilter !== 'All Types' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setActionFilter('All Types')}>Type: {actionFilter} &times;</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Action</TableHead>
                                <TableHead>Performed By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => {
                                    const config = actionTypeConfig[log.actionType];
                                    const Icon = config.icon;
                                    return (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Icon className={cn("h-5 w-5", config.color)} />
                                                    <span className="font-medium">{log.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={log.user.avatarUrl} alt={log.user.name} />
                                                        <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{log.user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {clientReady ? new Date(log.timestamp).toLocaleString() : ''}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{log.details}</TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                    No log entries found for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
             <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredLogs.length}</strong> of <strong>{mockLogs.length}</strong> total records.
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
