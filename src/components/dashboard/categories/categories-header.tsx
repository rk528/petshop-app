"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "./category-dialog";
import type { Category } from "@prisma/client";

interface CategoriesHeaderProps {
  parentCategories: Category[];
}

export function CategoriesHeader({ parentCategories }: CategoriesHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="text-muted-foreground">
          Organize products into hierarchical categories
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Category
      </Button>

      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        parentCategories={parentCategories}
      />
    </div>
  );
}
