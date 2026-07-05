"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Users,
  Truck,
  ShoppingCart,
  Tag,
  Ticket,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
  PawPrint,
  Store,
  History,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useStoreSettings } from "@/lib/store-settings";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserRole } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image?: string;
}

const menuItems = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
      {
        title: "Point of Sale",
        href: "/pos",
        icon: Store,
        roles: ["ADMIN", "MANAGER", "CASHIER"],
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        title: "Products",
        href: "/dashboard/products",
        icon: Package,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Categories",
        href: "/dashboard/categories",
        icon: FolderTree,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Low Stock Alerts",
        href: "/dashboard/low-stock",
        icon: AlertTriangle,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Purchasing",
    items: [
      {
        title: "Suppliers",
        href: "/dashboard/suppliers",
        icon: Truck,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Purchase Orders",
        href: "/dashboard/purchases",
        icon: ShoppingCart,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Marketing",
    items: [
      {
        title: "Promotions",
        href: "/dashboard/promotions",
        icon: Tag,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Coupons",
        href: "/dashboard/coupons",
        icon: Ticket,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "Reports",
    items: [
      {
        title: "Sales",
        href: "/dashboard/sales",
        icon: BarChart3,
        roles: ["ADMIN", "MANAGER"],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Users",
        href: "/dashboard/users",
        icon: Users,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Audit Logs",
        href: "/dashboard/audit-logs",
        icon: History,
        roles: ["ADMIN", "MANAGER"],
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: ["ADMIN"],
      },
    ],
  },
];

export function DashboardSidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { storeName } = useStoreSettings();

  const filteredMenuItems = menuItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.roles.includes(user.role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
                  <PawPrint className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-base">{storeName}</span>
                  <span className="text-xs text-sidebar-foreground/60">
                    POS System
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {filteredMenuItems.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full" asChild>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {user.role}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator />
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
