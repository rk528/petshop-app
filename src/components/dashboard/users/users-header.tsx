"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserDialog } from "./user-dialog";
import type { UserRole } from "@prisma/client";

interface UsersHeaderProps {
  currentUserRole: UserRole;
}

export function UsersHeader({ currentUserRole }: UsersHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentUserRole={currentUserRole}
      />
    </>
  );
}
