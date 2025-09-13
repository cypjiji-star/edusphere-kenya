
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  LogOut,
  ChevronDown,
  Settings,
  HelpCircle,
  Palette,
  Building,
  ClipboardCheck,
  FileText,
  BookOpen,
  Shapes,
  ShieldCheck,
  Megaphone,
  MessageCircle,
  Calendar,
  CircleDollarSign,
  Receipt,
  FileClock,
  UserPlus,
  HeartPulse,
  Bell,
  Check,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { firestore } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit, updateDoc, doc } from 'firebase/firestore';

type Notification = {
    id: string;
    title: string;
    description: string;
    createdAt: any;
    read: boolean;
    href: string;
};

const navGroups = [
  {
    title: 'Academics',
    items: [
      { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
      { href: '/admin/grades', label: 'Grades & Exams', icon: FileText },
      { href: '/admin/timetable', label: 'Timetable', icon: Calendar },
      { href: '/admin/subjects', label: 'Classes & Subjects', icon: Shapes },
      { href: '/admin/health', label: 'Health & Incidents', icon: HeartPulse },
    ],
  },
   {
    title: 'Users',
    items: [
      { href: '/admin/enrolment', label: 'Student Enrolment', icon: UserPlus },
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/permissions', label: 'Roles & Permissions', icon: ShieldCheck },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/admin/messaging', label: 'Messaging', icon: MessageCircle },
      { href: '/admin/calendar', label: 'Events Calendar', icon: Calendar },
    ],
  },
  {
    title: 'Finance',
    items: [
        { href: '/admin/fees', label: 'Fees & Payments', icon: CircleDollarSign },
        { href: '/admin/expenses', label: 'Expenses', icon: Receipt },
    ],
  },
  {
    title: 'School Settings',
    items: [
        { href: '/admin/profile', label: 'School Profile', icon: Building },
        { href: '/admin/branding', label: 'Branding', icon: Palette },
        { href: '/admin/settings', label: 'System Settings', icon: Settings },
    ]
  },
  {
    title: 'System',
    items: [
        { href: '/admin/logs', label: 'Audit Logs', icon: FileClock },
        { href: '/admin/support', label: 'Support & Feedback', icon: HelpCircle },
    ]
  }
];


function NotificationsPopover() {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    React.useEffect(() => {
        const q = query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
            setNotifications(fetchedNotifications);
        });
        return () => unsubscribe();
    }, []);
    
    const handleMarkAsRead = async (id: string) => {
        const notificationRef = doc(firestore, 'notifications', id);
        await updateDoc(notificationRef, { read: true });
    };

    const handleMarkAllRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read);
        for (const notification of unreadNotifications) {
            await handleMarkAsRead(notification.id);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 text-xs items-center justify-center bg-primary text-primary-foreground">{unreadCount}</span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="link" size="sm" className="h-auto p-0" onClick={handleMarkAllRead}>
                            Mark all as read
                        </Button>
                    )}
                </div>
                <div className="space-y-4">
                    {notifications.length > 0 ? notifications.map(notif => (
                         <div key={notif.id} className={cn("flex items-start gap-3", !notif.read && "font-semibold")}>
                             {!notif.read && <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            <div className="flex-1 space-y-1">
                                <Link href={notif.href || '#'} className="hover:underline text-sm">
                                    <p>{notif.title}</p>
                                    <p className={cn("text-xs", !notif.read ? "text-muted-foreground" : "text-muted-foreground/70")}>{notif.description}</p>
                                </Link>
                            </div>
                            {!notif.read && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleMarkAsRead(notif.id)}>
                                    <Check className="h-4 w-4"/>
                                </Button>
                            )}
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No new notifications.</p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <SidebarHeader className="flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">Admin Portal</span>
        </Link>
        <NotificationsPopover />
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/admin'} tooltip={{ children: 'Dashboard' }}>
              <Link href="/admin">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
         {navGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen>
              <SidebarMenuItem className="px-2 pt-2">
                <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between">
                         <span className="text-xs font-semibold text-muted-foreground">{group.title}</span>
                         <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-180" />
                    </div>
                </CollapsibleTrigger>
              </SidebarMenuItem>
            <CollapsibleContent>
                <SidebarMenu>
                    {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            tooltip={{ children: item.label }}
                        >
                            <Link href={item.href}>
                                <item.icon />
                                <span>{item.label}</span>
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://picsum.photos/seed/admin-avatar/100" alt="Admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@school.ac.ke
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/admin/profile">
                    <Settings className="mr-2" />Profile
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href="/admin/support">
                    <HelpCircle className="mr-2" />
                    Support
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/">
                    <LogOut className="mr-2" />
                    <span>Log out</span>
                </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </>
  );
}

