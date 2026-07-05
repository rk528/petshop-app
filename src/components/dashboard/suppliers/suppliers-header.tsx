"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupplierDialog } from "./supplier-dialog";

export function SuppliersHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
        <p className="text-muted-foreground">
          Manage your store's suppliers
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Supplier
      </Button>

      <SupplierDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
