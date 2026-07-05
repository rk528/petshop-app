"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductDialog } from "./product-dialog";
import type { Category, Supplier } from "@prisma/client";

interface ProductsHeaderProps {
  categories: Category[];
  suppliers: Supplier[];
}

export function ProductsHeader({ categories, suppliers }: ProductsHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Manage your store's product catalog
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Product
      </Button>

      <ProductDialog
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        suppliers={suppliers}
      />
    </div>
  );
}
