import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { CategoriesTable } from "@/components/dashboard/categories/categories-table";
import { CategoriesHeader } from "@/components/dashboard/categories/categories-header";
import { Skeleton } from "@/components/ui/skeleton";

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });
  return categories;
}

async function CategoriesList() {
  const categories = await getCategories();
  return <CategoriesTable categories={categories} />;
}

export default async function CategoriesPage() {
  const categories = await getCategories();
  const parentCategories = categories.filter((c) => !c.parentId);

  return (
    <div className="space-y-6 animate-fade-in">
      <CategoriesHeader parentCategories={parentCategories} />

      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <CategoriesList />
      </Suspense>
    </div>
  );
}
