
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

const navItems = [
  { href: '/admin/branding', label: 'Branding', icon: Palette },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/settings', label: 'School Settings', icon: Building },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

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
            <DropdownMenuItem><HelpCircle className="mr-2" />Support</DropdownMenuItem>
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
