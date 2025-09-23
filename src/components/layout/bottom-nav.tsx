"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardCheck,
  BookMarked,
  MessageCircle,
  User,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

interface BottomNavProps {
  items: BottomNavItem[];
}

export function BottomNav({ items }: BottomNavProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/teacher" || href === "/admin" || href === "/parent") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border/40 md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto font-medium">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-2 hover:bg-muted/50 group",
              isActive(item.href) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="w-5 h-5 mb-1 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
