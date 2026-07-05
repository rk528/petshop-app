"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Percent, DollarSign, Pencil } from "lucide-react";
import { format } from "date-fns";
import { PromotionDialog } from "./promotion-dialog";
import { useCurrency } from "@/lib/currency";

interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
}

interface PromotionProduct {
  productId: string;
  product: Product;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: PromotionProduct[];
  _count: {
    sales: number;
  };
}

interface PromotionCardProps {
  promotion: Promotion;
  allProducts: Product[];
}

export function PromotionCard({ promotion, allProducts }: PromotionCardProps) {
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency();
  const [editOpen, setEditOpen] = useState(false);
  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);

  const isActive = promotion.isActive && startDate <= now && endDate >= now;
  const isExpired = endDate < now;
  const isUpcoming = startDate > now;

  return (
    <>
      <Card className={!isActive ? "opacity-70" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                  promotion.discountType === "PERCENTAGE"
                    ? "bg-primary/10"
                    : "bg-emerald-500/10"
                }`}
              >
                {promotion.discountType === "PERCENTAGE" ? (
                  <Percent className="h-5 w-5 text-primary" />
                ) : (
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-base">{promotion.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {promotion.products.length} products
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Badge
                variant={
                  isActive ? "default" : isExpired ? "destructive" : "secondary"
                }
              >
                {isActive
                  ? "Active"
                  : isExpired
                  ? "Expired"
                  : isUpcoming
                  ? "Upcoming"
                  : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {promotion.description && (
            <p className="text-sm text-muted-foreground">
              {promotion.description}
            </p>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <span className="text-2xl font-bold text-primary">
              {promotion.discountType === "PERCENTAGE"
                ? `${Number(promotion.discountValue)}%`
                : formatCurrency(promotion.discountValue)}
            </span>
            <p className="text-xs text-muted-foreground mt-1">discount</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(startDate, "MMM dd")} - {format(endDate, "MMM dd, yyyy")}
            </span>
          </div>

          {promotion.minPurchase && (
            <p className="text-xs text-muted-foreground">
              Minimum purchase: {formatCurrency(promotion.minPurchase)}
            </p>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {promotion._count.sales} sales with this promotion
            </p>
          </div>
        </CardContent>
      </Card>

      <PromotionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        products={allProducts}
        promotion={{
          ...promotion,
          products: promotion.products.map((p) => ({ productId: p.productId })),
        }}
      />
    </>
  );
}
