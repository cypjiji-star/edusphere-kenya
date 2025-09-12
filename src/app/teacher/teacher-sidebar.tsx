
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookMarked,
  LogOut,
  ChevronDown,
  ClipboardCheck,
  FileText,
  MessageCircle,
  Calendar,
  BookOpen,
  Library,
  Settings,
  HelpCircle,
  Trophy,
  Megaphone,
  User,
  HeartPulse,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
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

const navGroups = [
  {
    title: 'Core Modules',
    items: [
      { href: '/teacher/students', label: 'Class Management', icon: Users },
      { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardCheck },
      { href: '/teacher/assignments', label: 'Assignments', icon: BookMarked },
      { href: '/teacher/grades', label: 'Grades/Reports', icon: FileText },
      { href: '/teacher/sports', label: 'Sports', icon: Trophy },
      { href: '/teacher/health', label: 'Health & Incidents', icon: HeartPulse },
    ],
  },
  {
    title: 'Instructional Tools',
    items: [
      { href: '/teacher/lesson-plans', label: 'Lesson Plans', icon: BookOpen, disabled: false },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/teacher/messaging', label: 'Messaging', icon: MessageCircle, disabled: false },
      { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone, disabled: false },
      { href: '/teacher/calendar', label: 'Events Calendar', icon: Calendar, disabled: false },
    ],
  },
  {
    title: 'Tools & Resources',
    items: [
        { href: '/teacher/library', label: 'Library Access', icon: Library, disabled: false },
        { href: '/teacher/my-library', label: 'My Library', icon: User, disabled: false },
    ],
  },
];


export function TeacherSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== '/teacher' && pathname.startsWith(href));

  return (
    <>
      <SidebarHeader>
        <Link href="/teacher" className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">EduSphere</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/teacher'} tooltip={{ children: 'Dashboard' }}>
              <Link href="/teacher">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {navGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen>
            <SidebarGroup>
                <CollapsibleTrigger asChild>
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)}
                                    disabled={item.disabled}
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
                    </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://picsum.photos/seed/teacher-avatar/100" alt="Teacher" />
                <AvatarFallback>T</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">Ms. Wanjiku</p>
                <p className="text-xs text-muted-foreground">Teacher</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Ms. Wanjiku</p>
                <p className="text-xs leading-none text-muted-foreground">
                  teacher@school.ac.ke
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Settings className="mr-2" />Profile &amp; Settings</DropdownMenuItem>
            <DropdownMenuItem><HelpCircle className="mr-2" />Support &amp; Feedback</DropdownMenuItem>
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
