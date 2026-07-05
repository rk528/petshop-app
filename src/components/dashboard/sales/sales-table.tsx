"use client";

import { useState } from "react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Search, Eye, Receipt, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/lib/currency";
import { type Serialized } from "@/lib/utils";
import type { Sale, SaleItem, Product, ProductVariant, User, Coupon } from "@prisma/client";

type SaleWithRelations = Serialized<Sale & {
  user: Pick<User, "name" | "email">;
  items: (SaleItem & {
    product: Product;
    variant: ProductVariant | null;
  })[];
  coupon: Coupon | null;
}>;

interface SalesTableProps {
  sales: SaleWithRelations[];
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  DIGITAL_WALLET: "Digital",
  BANK_TRANSFER: "Transfer",
  MIXED: "Mixed",
};

const statusColors: Record<string, "default" | "secondary" | "destructive"> = {
  COMPLETED: "default",
  REFUNDED: "destructive",
  PARTIALLY_REFUNDED: "secondary",
  VOIDED: "destructive",
};

export function SalesTable({ sales }: SalesTableProps) {
  const { format: formatCurrency } = useCurrency();
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleWithRelations | null>(null);

  const filteredSales = sales.filter(
    (sale) =>
      sale.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by receipt or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredSales.length} sales
        </Badge>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No sales found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {sale.receiptNumber}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {format(sale.createdAt, "MM/dd/yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(sale.createdAt, "HH:mm")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {sale.customerName ? (
                      <div>
                        <p className="font-medium">{sale.customerName}</p>
                        {sale.customerEmail && (
                          <p className="text-xs text-muted-foreground">
                            {sale.customerEmail}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{sale.user.name}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold">
                      {formatCurrency(sale.total)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={statusColors[sale.status]}>
                      {sale.status === "COMPLETED" ? "Completed" : sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedSale(sale)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sale Details Sheet */}
      <Sheet open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Sale Details
            </SheetTitle>
          </SheetHeader>

          {selectedSale && (
            <div className="space-y-6 mt-6">
              {/* Receipt Info */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receipt:</span>
                  <code className="bg-muted px-2 py-0.5 rounded text-sm">
                    {selectedSale.receiptNumber}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>
                    {format(selectedSale.createdAt, "MM/dd/yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier:</span>
                  <span>{selectedSale.user.name}</span>
                </div>
                {selectedSale.customerName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{selectedSale.customerName}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Products ({selectedSale.items.length})
                </h4>
                {selectedSale.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span>{formatCurrency(selectedSale.taxAmount)}</span>
                </div>
                {Number(selectedSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedSale.discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedSale.total)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method:</span>
                  <Badge variant="outline">
                    {paymentMethodLabels[selectedSale.paymentMethod]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid:</span>
                  <span>{formatCurrency(selectedSale.amountPaid)}</span>
                </div>
                {Number(selectedSale.changeGiven) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Change:</span>
                    <span>{formatCurrency(selectedSale.changeGiven)}</span>
                  </div>
                )}
                {selectedSale.coupon && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon:</span>
                    <Badge variant="secondary">{selectedSale.coupon.code}</Badge>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
