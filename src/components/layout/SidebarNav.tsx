
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ListChecks,
  FileText,
  Send,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip: string;
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    tooltip: "Dashboard",
  },
  {
    href: "/candidates",
    label: "Candidates",
    icon: Users,
    tooltip: "Manage Candidates",
  },
  {
    href: "/email-lists",
    label: "Email Lists",
    icon: ListChecks,
    tooltip: "Manage Email Lists",
  },
  {
    href: "/templates",
    label: "Templates",
    icon: FileText,
    tooltip: "Manage Email Templates",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Send,
    tooltip: "Manage Campaigns",
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} >
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              tooltip={{ children: item.tooltip, className: "bg-sidebar text-sidebar-foreground border-sidebar-border" }}
              className={cn(
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground"
              )}
            >
              <a>
                <item.icon />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
