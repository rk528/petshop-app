import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { POSTerminal } from "@/components/pos/pos-terminal";
import { Skeleton } from "@/components/ui/skeleton";
import { serialize } from "@/lib/utils";

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      variants: {
        where: { isActive: true },
      },
    },
    orderBy: { name: "asc" },
  });
  
  return serialize(products);
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return serialize(categories);
}

async function getActivePromotions() {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    include: {
      products: {
        include: { product: true },
      },
    },
  });
  
  return serialize(promotions);
}

async function POSContent() {
  const session = await auth();
  const [products, categories, promotions] = await Promise.all([
    getProducts(),
    getCategories(),
    getActivePromotions(),
  ]);

  return (
    <POSTerminal
      products={products}
      categories={categories}
      promotions={promotions}
      user={session!.user}
    />
  );
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </div>
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
