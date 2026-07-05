import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { SuppliersTable } from "@/components/dashboard/suppliers/suppliers-table";
import { SuppliersHeader } from "@/components/dashboard/suppliers/suppliers-header";
import { Skeleton } from "@/components/ui/skeleton";

async function getSuppliers() {
  return prisma.supplier.findMany({
    include: {
      _count: {
        select: { products: true, purchases: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

async function SuppliersList() {
  const suppliers = await getSuppliers();
  return <SuppliersTable suppliers={suppliers} />;
}

export default function SuppliersPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <SuppliersHeader />
      
      <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
        <SuppliersList />
      </Suspense>
    </div>
  );
}
