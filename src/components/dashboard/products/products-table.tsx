"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductDialog } from "./product-dialog";
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Search,
  Package,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/lib/currency";
import { type Serialized } from "@/lib/utils";
import type { Product, Category, Supplier, ProductVariant } from "@prisma/client";

type ProductWithRelations = Serialized<Product & {
  category: Category;
  supplier: Supplier | null;
  variants: ProductVariant[];
}>;

interface ProductsTableProps {
  products: ProductWithRelations[];
  categories: Serialized<Category>[];
  suppliers: Serialized<Supplier>[];
}

export function ProductsTable({
  products,
  categories,
  suppliers,
}: ProductsTableProps) {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [editProduct, setEditProduct] = useState<Serialized<Product> | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Serialized<Product> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteProduct) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${deleteProduct.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error deleting");

      toast.success("Product deleted", {
        description: `${deleteProduct.name} has been deleted`,
      });
      router.refresh();
    } catch {
      toast.error("Error", { description: "Could not delete the product" });
    } finally {
      setIsDeleting(false);
      setDeleteProduct(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredProducts.length} products
        </Badge>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No products found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.stockQuantity <= product.lowStockThreshold;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.variants.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {product.variants.length} variants
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {product.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <p className="font-medium">
                          {formatCurrency(product.basePrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Cost: {formatCurrency(product.costPrice)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge
                          variant={isLowStock ? "destructive" : "secondary"}
                        >
                          {product.stockQuantity} {product.unit}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditProduct(product)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteProduct(product)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editProduct && (
        <ProductDialog
          open={!!editProduct}
          onOpenChange={() => setEditProduct(null)}
          categories={categories}
          suppliers={suppliers}
          product={editProduct}
        />
      )}

      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The product &quot;{deleteProduct?.name}&quot;
              will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
