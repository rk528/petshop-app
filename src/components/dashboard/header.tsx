"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Moon, 
  Sun, 
  Search, 
  AlertTriangle, 
  ShoppingCart, 
  Package,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@prisma/client";

interface Notification {
  id: string;
  type: "low_stock" | "sale" | "purchase";
  title: string;
  message: string;
  urgent: boolean;
  link: string;
  createdAt: string;
}

interface NotificationData {
  notifications: Notification[];
  counts: {
    lowStock: number;
    criticalStock: number;
    recentSales: number;
    pendingPurchases: number;
    total: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export function DashboardHeader({ user }: { user: User }) {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  const getNotificationIcon = (type: Notification["type"], urgent: boolean) => {
    switch (type) {
      case "low_stock":
        return <AlertTriangle className={`h-4 w-4 ${urgent ? "text-destructive" : "text-amber-500"}`} />;
      case "sale":
        return <ShoppingCart className="h-4 w-4 text-emerald-500" />;
      case "purchase":
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationDot = (type: Notification["type"], urgent: boolean) => {
    if (type === "low_stock") {
      return urgent ? "bg-destructive" : "bg-amber-500";
    }
    if (type === "sale") return "bg-emerald-500";
    return "bg-blue-500";
  };

  const urgentCount = notifications?.counts.criticalStock || 0;
  const totalCount = notifications?.counts.total || 0;

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <SidebarTrigger className="-ml-2" />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex-1 flex items-center gap-4">
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products, customers..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {totalCount > 0 && (
                <Badge
                  variant={urgentCount > 0 ? "destructive" : "secondary"}
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <div className="flex items-center justify-between p-3 border-b">
              <div>
                <h4 className="font-semibold">Notifications</h4>
                {urgentCount > 0 && (
                  <p className="text-xs text-destructive">
                    {urgentCount} urgent alert{urgentCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  fetchNotifications();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            
            <ScrollArea className="max-h-80">
              {isLoading && !notifications ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications?.notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications?.notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      notification.urgent ? "bg-destructive/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification.link)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type, notification.urgent)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${getNotificationDot(notification.type, notification.urgent)}`} />
                        <span className={`font-medium text-sm ${notification.urgent ? "text-destructive" : ""}`}>
                          {notification.title}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.message}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>

            {notifications && notifications.counts.lowStock > 0 && (
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full text-sm"
                  onClick={() => handleNotificationClick("/dashboard/low-stock")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  View all {notifications.counts.lowStock} stock alerts
                </Button>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
