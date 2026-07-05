"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PurchaseDialog } from "./purchase-dialog";
import type { Supplier } from "@prisma/client";

// Serialized product type (Decimal fields converted to numbers)
export interface SerializedProduct {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  categoryId: string;
  supplierId: string | null;
  basePrice: number;
  costPrice: number;
  taxRate: number;
  stockQuantity: number;
  lowStockThreshold: number;
  unit: string;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PrefillData {
  productId: string;
  supplierId: string;
  productName: string;
  costPrice: number;
  reorderQty: number;
}

interface PurchasesHeaderProps {
  suppliers: Supplier[];
  products: SerializedProduct[];
  prefillData?: PrefillData | null;
}

export function PurchasesHeader({ suppliers, products, prefillData }: PurchasesHeaderProps) {
  const [open, setOpen] = useState(false);

  // Auto-open dialog if prefill data is provided
  useEffect(() => {
    if (prefillData) {
      setOpen(true);
    }
  }, [prefillData]);

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-muted-foreground">
          Manage supplier purchases
        </p>
      </div>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New Order
      </Button>

      <PurchaseDialog
        open={open}
        onOpenChange={setOpen}
        suppliers={suppliers}
        products={products}
        prefillData={prefillData}
      />
    </div>
  );
}
