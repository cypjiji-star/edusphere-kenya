
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
import { collection, onSnapshot, query, where, doc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';


const navItems = [
    { href: '/parent/announcements', label: 'Announcements', icon: Megaphone, badgeKey: 'unreadAnnouncements' },
    { href: '/parent/attendance', label: 'Attendance', icon: ClipboardCheck, badgeKey: null },
    { href: '/parent/grades', label: 'Grades & Exams', icon: FileText, badgeKey: null },
    { href: '/parent/timetable', label: 'Timetable', icon: Calendar, badgeKey: null },
    { href: '/parent/fees', label: 'Fees & Payments', icon: CircleDollarSign, badgeKey: null },
    { href: '/parent/health', label: 'Health & Incidents', icon: HeartPulse, badgeKey: null },
    { href: '/parent/calendar', label: 'Events Calendar', icon: Calendar, badgeKey: null },
];


export function ParentSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const isActive = (href: string) => pathname.startsWith(href);
  const [dynamicBadges, setDynamicBadges] = React.useState<Record<string, number>>({});
  const { user } = useAuth();
  const [parentName, setParentName] = React.useState('Parent');
  const [parentEmail, setParentEmail] = React.useState('');
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (user && schoolId) {
      // Parents might not have a direct user doc, so we find their name from one of their children's records.
      const studentsQuery = query(collection(firestore, `schools/${schoolId}/students`), where('parentId', '==', user.uid), limit(1));
      const unsubscribe = onSnapshot(studentsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const studentData = snapshot.docs[0].data();
          setParentName(studentData.parentName || 'Parent');
        }
        setParentEmail(user.email || '');
      });
      return () => unsubscribe();
    }
  }, [user, schoolId]);


  React.useEffect(() => {
    if (!schoolId || !user) return;

    const unreadAnnouncementsQuery = query(collection(firestore, `schools/${schoolId}/announcements`));
    const unsubscribeAnnouncements = onSnapshot(unreadAnnouncementsQuery, (snapshot) => {
        let unreadCount = 0;
        snapshot.forEach(doc => {
            const readBy = doc.data().readBy || [];
            if (!readBy.includes(user.uid)) {
                unreadCount++;
            }
        });
        setDynamicBadges(prev => ({...prev, unreadAnnouncements: unreadCount}));
    });
    
    return () => {
        unsubscribeAnnouncements();
    };
  }, [schoolId, user]);

  return (
    <>
      <SidebarHeader>
        <Link href={`/parent?schoolId=${schoolId}`} onClick={handleLinkClick} className="flex items-center gap-2">
          <GraduationCap className="size-6 text-primary" />
          <span className="font-bold font-headline text-lg">Parent Portal</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/parent'} tooltip={{ children: 'Dashboard' }}>
              <Link href={`/parent?schoolId=${schoolId}`} onClick={handleLinkClick}>
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
            {navItems.map((item) => {
                const badgeCount = item.badgeKey ? dynamicBadges[item.badgeKey] : 0;
                return (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
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
      </SidebarContent>

      <SidebarFooter className="flex items-center gap-2 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/parent1/100"} alt="Parent" />
                <AvatarFallback>{parentName.charAt(0) || 'P'}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">{parentName}</p>
                <p className="text-xs text-muted-foreground">Parent</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{parentName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {parentEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled><Settings className="mr-2" />Profile & Settings</DropdownMenuItem>
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
