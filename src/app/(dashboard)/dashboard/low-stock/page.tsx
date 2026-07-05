import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serialize } from "@/lib/utils";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import Link from "next/link";

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      stockQuantity: {
        lte: prisma.product.fields.lowStockThreshold,
      },
    },
    include: {
      category: true,
      supplier: true,
    },
    orderBy: { stockQuantity: "asc" },
  });

  return serialize(products);
}

export default async function LowStockPage() {
  const products = await getLowStockProducts();

  const critical = products.filter((p) => p.stockQuantity <= 5);
  const warning = products.filter((p) => p.stockQuantity > 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Alerts</h1>
          <p className="text-muted-foreground">
            Products requiring urgent restocking
          </p>
        </div>
        <Badge variant="destructive" className="text-sm py-1 px-3">
          {products.length} low stock products
        </Badge>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">All good!</h3>
            <p className="text-muted-foreground">
              No products with low stock at this time
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Critical Stock */}
          {critical.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-semibold text-destructive">
                  Critical Stock ({critical.length})
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {critical.map((product) => (
                  <Card
                    key={product.id}
                    className="border-destructive/50 bg-destructive/5"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {product.category.name}
                          </p>
                        </div>
                        <Badge variant="destructive" className="shrink-0">
                          {product.stockQuantity} {product.unit}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SKU:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {product.sku}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min stock:</span>
                          <span>{product.lowStockThreshold}</span>
                        </div>
                        {product.supplier && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{product.supplier.name}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        asChild
                      >
                        <Link 
                          href={`/dashboard/purchases?productId=${product.id}&supplierId=${product.supplierId || ""}&productName=${encodeURIComponent(product.name)}&costPrice=${product.costPrice}&reorderQty=${product.lowStockThreshold - product.stockQuantity + 10}`}
                        >
                          Create purchase order
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Warning Stock */}
          {warning.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-amber-600">
                  Low Stock ({warning.length})
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {warning.map((product) => (
                  <Card
                    key={product.id}
                    className="border-amber-500/50 bg-amber-500/5"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{product.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {product.category.name}
                          </p>
                        </div>
                        <Badge className="shrink-0 bg-amber-500 text-white">
                          {product.stockQuantity} {product.unit}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SKU:</span>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                            {product.sku}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Min stock:</span>
                          <span>{product.lowStockThreshold}</span>
                        </div>
                        {product.supplier && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span>{product.supplier.name}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        asChild
                      >
                        <Link 
                          href={`/dashboard/purchases?productId=${product.id}&supplierId=${product.supplierId || ""}&productName=${encodeURIComponent(product.name)}&costPrice=${product.costPrice}&reorderQty=${product.lowStockThreshold - product.stockQuantity + 10}`}
                        >
                          Create purchase order
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
