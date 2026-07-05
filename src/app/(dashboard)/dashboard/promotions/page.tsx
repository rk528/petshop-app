import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { serialize } from "@/lib/utils";
import { Tag } from "lucide-react";
import { PromotionsHeader } from "@/components/dashboard/promotions/promotions-header";
import { PromotionCard } from "@/components/dashboard/promotions/promotion-card";

async function getPromotions() {
  const promotions = await prisma.promotion.findMany({
    include: {
      products: {
        include: { product: true },
      },
      _count: {
        select: { sales: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(promotions);
}

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      basePrice: true,
    },
    orderBy: { name: "asc" },
  });
  return serialize(products).map((p: { id: string; name: string; sku: string; basePrice: unknown }) => ({
    ...p,
    basePrice: Number(p.basePrice),
  }));
}

async function PromotionsList({ products }: { products: Array<{ id: string; name: string; sku: string; basePrice: number }> }) {
  const promotions = await getPromotions();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {promotions.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No promotions</h3>
            <p className="text-muted-foreground">No promotions created yet</p>
          </CardContent>
        </Card>
      ) : (
        promotions.map((promo) => (
          <PromotionCard 
            key={promo.id} 
            promotion={{
              ...promo,
              discountValue: Number(promo.discountValue),
              minPurchase: promo.minPurchase ? Number(promo.minPurchase) : null,
              maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
              startDate: String(promo.startDate),
              endDate: String(promo.endDate),
              products: promo.products.map((pp: { productId: string; product: { id: string; name: string; sku: string; basePrice: unknown } }) => ({
                ...pp,
                product: {
                  ...pp.product,
                  basePrice: Number(pp.product.basePrice),
                },
              })),
            }} 
            allProducts={products} 
          />
        ))
      )}
    </div>
  );
}

export default async function PromotionsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6 animate-fade-in">
      <PromotionsHeader products={products} />

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <PromotionsList products={products} />
      </Suspense>
    </div>
  );
}
