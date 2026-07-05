import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { serialize } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Truck, Calendar, Package } from "lucide-react";
import { format } from "date-fns";
import { PurchasesHeader } from "@/components/dashboard/purchases/purchases-header";
import { CurrencyAmount } from "@/lib/currency";

async function getPurchases() {
  const purchases = await prisma.purchase.findMany({
    include: {
      supplier: true,
      user: { select: { name: true } },
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return serialize(purchases);
}

async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return serialize(suppliers);
}

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return serialize(products).map((p: any) => ({
    ...p,
    basePrice: Number(p.basePrice),
    costPrice: Number(p.costPrice || 0),
    taxRate: Number(p.taxRate || 0),
  }));
}

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  ORDERED: "outline",
  SHIPPED: "default",
  RECEIVED: "default",
  CANCELLED: "destructive",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  ORDERED: "Ordered",
  SHIPPED: "Shipped",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

async function PurchasesList() {
  const purchases = await getPurchases();

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No purchase orders</h3>
          <p className="text-muted-foreground">
            Create your first purchase order to restock inventory
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-center">Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <TableRow key={purchase.id}>
              <TableCell>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {purchase.purchaseNumber}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{purchase.supplier.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(purchase.createdAt, "MM/dd/yyyy")}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary">
                  <Package className="h-3 w-3 mr-1" />
                  {purchase.items.length}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">
                  <CurrencyAmount amount={Number(purchase.total)} />
                </span>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={statusColors[purchase.status]}>
                  {statusLabels[purchase.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{
    productId?: string;
    supplierId?: string;
    productName?: string;
    costPrice?: string;
    reorderQty?: string;
  }>;
}

export default async function PurchasesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [suppliers, products] = await Promise.all([
    getSuppliers(),
    getProducts(),
  ]);

  // Pre-fill data from URL params (coming from low stock page)
  const prefillData = params.productId ? {
    productId: params.productId,
    supplierId: params.supplierId || "",
    productName: params.productName || "",
    costPrice: params.costPrice ? parseFloat(params.costPrice) : 0,
    reorderQty: params.reorderQty ? parseInt(params.reorderQty) : 10,
  } : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PurchasesHeader 
        suppliers={suppliers} 
        products={products}
        prefillData={prefillData}
      />

      <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
        <PurchasesList />
      </Suspense>
    </div>
  );
}
