
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  GraduationCap,
  LayoutDashboard,
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
  Trophy,
  User,
  Users,
  Library,
  BookOpen,
  Bell,
  Check,
  BookMarked,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar
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
import * as React from 'react';
import { firestore, auth } from '@/lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';


const navGroups = [
  {
    title: 'Core Modules',
    items: [
      { href: '/teacher/students', label: 'Class Management', icon: Users, badgeKey: null },
      { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardCheck, badgeKey: null },
      { href: '/teacher/payments', label: 'Class Funds', icon: CircleDollarSign, badgeKey: null },
      { href: '/teacher/sports', label: 'Sports', icon: Trophy, badgeKey: null },
      { href: '/teacher/health', label: 'Health & Incidents', icon: HeartPulse, badgeKey: null },
    ],
  },
  {
    title: 'Instructional Tools',
    items: [
      { href: '/teacher/assignments', label: 'Assignments', icon: BookMarked, badgeKey: 'ungradedAssignments' },
      { href: '/teacher/grades', label: 'Grades & Exams', icon: FileText, badgeKey: null },
      { href: '/teacher/lesson-plans', label: 'Lesson Plans', icon: BookOpen, disabled: false, badgeKey: null },
    ],
  },
  {
    title: 'Communication',
    items: [
      { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone, disabled: false, badgeKey: null },
      { href: '/teacher/messaging', label: 'Messaging', icon: MessageCircle, disabled: false, badgeKey: null },
      { href: '/teacher/calendar', label: 'Events Calendar', icon: Calendar, disabled: false, badgeKey: null },
    ],
  },
  {
    title: 'Tools & Resources',
    items: [
        { href: '/teacher/library', label: 'Library Access', icon: Library, disabled: false, badgeKey: null },
        { href: '/teacher/my-library', label: 'My Library', icon: User, disabled: false, badgeKey: null },
    ],
  },
];

export function TeacherSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId')!;
  const isActive = (href: string) => pathname === href || (href !== '/teacher' && pathname.startsWith(href));
  const [dynamicBadges, setDynamicBadges] = React.useState<Record<string, number>>({});
  const { user } = useAuth();
  const [teacherName, setTeacherName] = React.useState('Teacher');
  const [teacherEmail, setTeacherEmail] = React.useState('');
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (user && schoolId) {
      const userDocRef = doc(firestore, `schools/${schoolId}/users`, user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setTeacherName(userData.name || 'Teacher');
          setTeacherEmail(userData.email || '');
        }
      });
      return () => unsubscribe();
    }
  }, [user, schoolId]);

  React.useEffect(() => {
    if (!schoolId || !user) return;

    const teacherId = user.uid;
    
    // Ungraded assignments count
    const assignmentsQuery = query(collection(firestore, `schools/${schoolId}/assignments`), where('teacherId', '==', teacherId));
    const unsubscribeAssignments = onSnapshot(assignmentsQuery, (snapshot) => {
        let ungradedCount = 0;
        snapshot.forEach(doc => {
            const assignment = doc.data();
            if (assignment.submissions < assignment.totalStudents) ungradedCount++;
        });
        setDynamicBadges(prev => ({ ...prev, ungradedAssignments: ungradedCount }));
    });

    // Cleanup listeners on component unmount
    return () => {
        unsubscribeAssignments();
    };
  }, [schoolId, user]);

  return (
    <>
      <SidebarHeader>
        <Link href={`/teacher?schoolId=${schoolId}`} onClick={handleLinkClick} className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">Teacher Portal</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/teacher'} tooltip={{ children: 'Dashboard' }}>
              <Link href={`/teacher?schoolId=${schoolId}`} onClick={handleLinkClick}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {navGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen>
            <CollapsibleTrigger className="w-full p-2 text-left">
                <span className="text-xs font-semibold text-primary">{group.title}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <SidebarMenu>
                    {group.items.map((item) => {
                        const badgeCount = item.badgeKey ? dynamicBadges[item.badgeKey] : 0;
                        return (
                        <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                            asChild
                            isActive={isActive(item.href)}
                            disabled={item.disabled}
                            tooltip={{ children: item.label }}
                        >
                            <Link href={`${item.href}?schoolId=${schoolId}`} onClick={handleLinkClick}>
                                <item.icon />
                                <span>{item.label}</span>
                                {badgeCount > 0 && <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>}
                            </Link>
                        </SidebarMenuButton>
                        </SidebarMenuItem>
                    )})}
                </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{teacherName.charAt(0) || 'T'}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">{teacherName}</p>
                <p className="text-xs text-muted-foreground">Teacher</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{teacherName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {teacherEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled><Settings className="mr-2" />Profile &amp; Settings</DropdownMenuItem>
            <DropdownMenuItem asChild>
                <Link href={`/teacher/support?schoolId=${schoolId}`} onClick={handleLinkClick}>
                    <HelpCircle className="mr-2" />
                    Support &amp; Feedback
                </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             <DropdownMenuItem asChild>
                <Link href="/" onClick={() => auth.signOut()}>
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
