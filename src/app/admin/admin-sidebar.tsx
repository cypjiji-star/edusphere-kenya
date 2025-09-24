
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
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
  Trophy,
  Library,
  Bed,
  Package,
  Contact2,
} from "lucide-react";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { firestore } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  updateDoc,
  doc,
  where,
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";

const navGroups = [
  {
    title: "Academics",
    items: [
      {
        href: "/admin/attendance",
        label: "Attendance",
        icon: ClipboardCheck,
        collection: "leave-applications",
        field: "status",
        value: "Pending",
      },
      { href: "/admin/grades", label: "Grades & Exams", icon: FileText },
      { href: "/admin/timetable", label: "Timetable", icon: Calendar },
      { href: "/admin/subjects", label: "Classes & Subjects", icon: Shapes },
      { href: "/admin/health", label: "Health & Incidents", icon: HeartPulse },
    ],
  },
  {
    title: "Users",
    items: [
      {
        href: "/admin/enrolment",
        label: "Student Enrolment",
        icon: UserPlus,
        badge: "0",
        collection: "users",
        role: "Student",
        field: "status",
        value: "Pending",
      },
      {
        href: "/admin/students",
        label: "Student Management",
        icon: GraduationCap,
      },
      { href: "/admin/users-list", label: "User Management", icon: Users },
      {
        href: "/admin/permissions",
        label: "Roles & Permissions",
        icon: ShieldCheck,
      },
    ],
  },
  {
    title: "Communication",
    items: [
      {
        href: "/admin/announcements",
        label: "Announcements",
        icon: Megaphone,
        badge: null,
        collection: "",
      },
      {
        href: "/admin/messaging",
        label: "Direct Messaging",
        icon: MessageCircle,
        collection: "support-chats",
        field: "isEscalated",
        value: true,
      },
      { href: "/admin/calendar", label: "Events Calendar", icon: Calendar },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/fees", label: "Fees & Payments", icon: CircleDollarSign },
      {
        href: "/admin/expenses",
        label: "Expenses",
        icon: Receipt,
        collection: "expenses",
        field: "status",
        value: "Pending Approval",
      },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/admin/sports", label: "Teams & Clubs", icon: Trophy },
      { href: "/admin/library", label: "Library", icon: Library },
      { href: "/admin/boarding", label: "Boarding", icon: Bed },
      { href: "/admin/storage", label: "School Storage", icon: Package },
    ],
  },
  {
    title: "School Settings",
    items: [
      { href: "/admin/profile", label: "School Profile", icon: Building },
      { href: "/admin/branding", label: "Branding", icon: Palette },
      { href: "/admin/settings", label: "System Settings", icon: Settings },
    ],
  },
  {
    title: "System",
    items: [{ href: "/admin/logs", label: "Audit Logs", icon: FileClock }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId") || "";
  const { user } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = (href: string) => pathname.startsWith(href);
  const [dynamicBadges, setDynamicBadges] = React.useState<
    Record<string, number>
  >({});

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  React.useEffect(() => {
    if (!schoolId) return;

    const unsubscribes = navGroups
      .flatMap((g) => g.items)
      .filter((item) => item.collection && item.field && item.value)
      .map((item) => {
        const queryConstraints = [where(item.field!, "==", item.value!)];
        if (item.role) {
          queryConstraints.push(where("role", "==", item.role));
        }
        const q = query(
          collection(firestore, "schools", schoolId, item.collection!),
          ...queryConstraints,
        );
        return onSnapshot(q, (snapshot) => {
          setDynamicBadges((prev) => ({ ...prev, [item.href]: snapshot.size }));
        });
      });

    return () => unsubscribes.forEach((unsub) => unsub());
  }, [schoolId]);

  return (
    <>
      <SidebarHeader className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/admin"}
              tooltip={{ children: "Dashboard" }}
            >
              <Link
                href={`/admin?schoolId=${schoolId}`}
                onClick={handleLinkClick}
              >
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {navGroups.map((group) => (
          <Collapsible key={group.title} defaultOpen>
            <SidebarMenuItem className="px-2 pt-2">
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    {group.title}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-180" />
                </div>
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const badgeCount = dynamicBadges[item.href];
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={{ children: item.label }}
                      >
                        <Link
                          href={`${item.href}?schoolId=${schoolId}`}
                          onClick={handleLinkClick}
                        >
                          <item.icon />
                          <span>{item.label}</span>
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <SidebarMenuBadge>{badgeCount}</SidebarMenuBadge>
                          )}
                          {item.badge && !badgeCount && (
                            <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="flex items-center gap-2 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 p-2 h-auto"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.displayName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">
                  {user?.displayName || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || "Admin User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "admin@school.ac.ke"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/admin/profile?schoolId=${schoolId}`}
                onClick={handleLinkClick}
              >
                <Settings className="mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <HelpCircle className="mr-2" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" onClick={handleLinkClick}>
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
