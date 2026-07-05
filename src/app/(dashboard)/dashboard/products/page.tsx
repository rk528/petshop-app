import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { ProductsTable } from "@/components/dashboard/products/products-table";
import { ProductsHeader } from "@/components/dashboard/products/products-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serialize } from "@/lib/utils";

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplier: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
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

async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return serialize(suppliers);
}

async function ProductsList() {
  const [products, categories, suppliers] = await Promise.all([
    getProducts(),
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <ProductsTable
      products={products}
      categories={categories}
      suppliers={suppliers}
    />
  );
}

export default async function ProductsPage() {
  const [categories, suppliers] = await Promise.all([
    getCategories(),
    getSuppliers(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <ProductsHeader categories={categories} suppliers={suppliers} />
      
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
