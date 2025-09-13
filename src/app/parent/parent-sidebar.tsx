
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
  FileText,
  MessageCircle,
  Calendar,
  CircleDollarSign,
  ClipboardCheck,
  Megaphone,
  HeartPulse,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
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

const navItems = [
    { href: '/parent/announcements', label: 'Announcements', icon: Megaphone, unread: 2, badge: null },
    { href: '/parent/attendance', label: 'Attendance', icon: ClipboardCheck, unread: 0, badge: null },
    { href: '/parent/grades', label: 'Grades & Exams', icon: FileText, unread: 0, badge: 'New' },
    { href: '/parent/timetable', label: 'Timetable', icon: Calendar, unread: 0, badge: null },
    { href: '/parent/fees', label: 'Fees & Payments', icon: CircleDollarSign, unread: 0, badge: null },
    { href: '/parent/health', label: 'Health & Incidents', icon: HeartPulse, unread: 0, badge: null },
    { href: '/parent/messaging', label: 'Messages', icon: MessageCircle, unread: 1, badge: null },
    { href: '/parent/calendar', label: 'Events Calendar', icon: Calendar, unread: 0, badge: null },
];


export function ParentSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <SidebarHeader>
        <Link href="/parent" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">Parent Portal</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/parent'} tooltip={{ children: 'Dashboard' }}>
              <Link href="/parent">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
            {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={{ children: item.label }}
                >
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                         {item.unread && item.unread > 0 && <SidebarMenuBadge>{item.unread}</SidebarMenuBadge>}
                         {item.badge && <SidebarMenuBadge className="bg-destructive">{item.badge}</SidebarMenuBadge>}
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://picsum.photos/seed/parent1/100" alt="Parent" />
                <AvatarFallback>P</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">Mr. Omondi</p>
                <p className="text-xs text-muted-foreground">Parent</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Mr. Omondi</p>
                <p className="text-xs leading-none text-muted-foreground">
                  parent@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled><Settings className="mr-2" />Profile & Settings</DropdownMenuItem>
            <DropdownMenuItem disabled><HelpCircle className="mr-2" />Support</DropdownMenuItem>
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
