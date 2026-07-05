import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, UserCheck, UserX } from "lucide-react";
import { format } from "date-fns";
import { UsersHeader } from "@/components/dashboard/users/users-header";
import { UserActions } from "@/components/dashboard/users/user-actions";
import type { UserRole } from "@prisma/client";

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: { sales: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

const roleColors: Record<string, "default" | "secondary" | "destructive"> = {
  ADMIN: "destructive",
  MANAGER: "default",
  CASHIER: "secondary",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  MANAGER: "Manager",
  CASHIER: "Cashier",
};

async function UsersList({ currentUserRole, currentUserId }: { currentUserRole: UserRole; currentUserId: string }) {
  const users = await getUsers();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user) => {
        // Determine if current user can edit this user
        const canEdit =
          currentUserRole === "ADMIN" ||
          (currentUserRole === "MANAGER" && user.role === "CASHIER");
        
        const canDelete = currentUserRole === "ADMIN" && user.id !== currentUserId;

        return (
          <Card key={user.id} className={!user.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {user.name}
                      {user.id === currentUserId && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isActive ? (
                    <UserCheck className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <UserX className="h-5 w-5 text-destructive" />
                  )}
                  {(canEdit || canDelete) && (
                    <UserActions
                      user={user}
                      currentUserRole={currentUserRole}
                      canEdit={canEdit}
                      canDelete={canDelete}
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </div>
                <Badge variant={user.isActive ? "outline" : "secondary"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="pt-2 border-t space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales made:</span>
                  <span className="font-medium">{user._count.sales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {format(user.createdAt, "MMM dd, yyyy")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function UsersPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  // Only ADMIN and MANAGER can access this page
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <UsersHeader currentUserRole={session.user.role} />

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40 mt-1" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <UsersList currentUserRole={session.user.role} currentUserId={session.user.id} />
      </Suspense>
    </div>
  );
}
