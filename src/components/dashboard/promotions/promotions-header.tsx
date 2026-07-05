"use client";

import { useState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PromotionDialog } from "./promotion-dialog";

interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
}

interface PromotionsHeaderProps {
  products: Product[];
}

export function PromotionsHeader({ products }: PromotionsHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
        <p className="text-muted-foreground">
          Manage product promotions and discounts
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <Tag className="mr-2 h-4 w-4" />
        New Promotion
      </Button>

      <PromotionDialog
        open={open}
        onOpenChange={setOpen}
        products={products}
      />
    </div>
  );
}
