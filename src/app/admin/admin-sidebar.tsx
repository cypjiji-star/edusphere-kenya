
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


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


export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <SidebarHeader>
        <Link href="/admin" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">Admin Portal</span>
        </Link>
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
            <DropdownMenuItem><Settings className="mr-2" />Profile</DropdownMenuItem>
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
