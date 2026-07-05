"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Package, AlertTriangle } from "lucide-react";
import { useCurrency } from "@/lib/currency";
import type { Supplier } from "@prisma/client";
import type { SerializedProduct } from "./purchases-header";

const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitCost: z.number().min(0, "Cost must be positive"),
});

const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  notes: z.string().optional(),
  expectedDate: z.string().optional(),
  shipping: z.number().min(0),
  tax: z.number().min(0),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;
type PurchaseItemValues = z.infer<typeof purchaseItemSchema>;

interface PrefillData {
  productId: string;
  supplierId: string;
  productName: string;
  costPrice: number;
  reorderQty: number;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  products: SerializedProduct[];
  prefillData?: PrefillData | null;
}

export function PurchaseDialog({
  open,
  onOpenChange,
  suppliers,
  products,
  prefillData,
}: PurchaseDialogProps) {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<PurchaseItemValues[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<PurchaseItemValues>>({
    productId: "",
    quantity: 1,
    unitCost: 0,
  });
  const [initialized, setInitialized] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      notes: "",
      expectedDate: "",
      shipping: 0,
      tax: 0,
    },
  });

  // Pre-fill data when dialog opens with prefill data
  useEffect(() => {
    if (prefillData && open && !initialized) {
      // Set supplier if provided
      if (prefillData.supplierId) {
        form.setValue("supplierId", prefillData.supplierId);
      }
      
      // Pre-fill the current item selection (so user sees it in dropdown)
      if (prefillData.productId) {
        setCurrentItem({
          productId: prefillData.productId,
          quantity: prefillData.reorderQty || 10,
          unitCost: prefillData.costPrice || 0,
        });
      }
      
      // Add note about low stock
      form.setValue("notes", `Reorder for low stock item: ${prefillData.productName}`);
      
      setInitialized(true);
    }
  }, [prefillData, open, initialized, form]);

  // Reset when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Clear URL params when closing
      router.replace("/dashboard/purchases");
      form.reset();
      setItems([]);
      setCurrentItem({ productId: "", quantity: 1, unitCost: 0 });
      setInitialized(false);
    }
    onOpenChange(newOpen);
  };

  const addItem = () => {
    if (!currentItem.productId || !currentItem.quantity || currentItem.unitCost === undefined) {
      toast.error("Please fill all item fields");
      return;
    }

    // Check if product already exists in items
    const existingIndex = items.findIndex(item => item.productId === currentItem.productId);
    if (existingIndex >= 0) {
      // Update quantity instead of adding duplicate
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += currentItem.quantity;
      setItems(updatedItems);
      toast.success("Quantity updated for existing item");
    } else {
      setItems([
        ...items,
        {
          productId: currentItem.productId,
          quantity: currentItem.quantity,
          unitCost: currentItem.unitCost,
        },
      ]);
    }
    setCurrentItem({ productId: "", quantity: 1, unitCost: 0 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const shipping = form.watch("shipping") || 0;
  const tax = form.watch("tax") || 0;
  const total = subtotal + shipping + tax;

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    return product?.name || "Unknown";
  };

  async function onSubmit(data: PurchaseFormValues) {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          items,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error creating purchase order");
      }

      const purchase = await response.json();

      toast.success("Purchase order created", {
        description: `Order ${purchase.purchaseNumber} has been created`,
      });

      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {prefillData ? "Create Purchase Order for Low Stock Item" : "New Purchase Order"}
          </DialogTitle>
        </DialogHeader>

        {/* Alert for prefilled item */}
        {prefillData && currentItem.productId && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              <strong>{prefillData.productName}</strong> is pre-selected below. 
              Click the <strong>+</strong> button to add it to your order.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Add Items Section */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items
              </h4>

              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <label className="text-sm text-muted-foreground mb-1 block">Product</label>
                  <Select
                    value={currentItem.productId}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      setCurrentItem({
                        ...currentItem,
                        productId: value,
                        unitCost: product ? product.costPrice : 0,
                      });
                    }}
                  >
                    <SelectTrigger className={currentItem.productId ? "border-primary" : ""}>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm text-muted-foreground mb-1 block">Qty</label>
                  <Input
                    type="number"
                    placeholder="Qty"
                    min={1}
                    value={currentItem.quantity || ""}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className={currentItem.quantity ? "border-primary" : ""}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-sm text-muted-foreground mb-1 block">Unit Cost</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Unit cost"
                    value={currentItem.unitCost || ""}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        unitCost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={currentItem.unitCost ? "border-primary" : ""}
                  />
                </div>
                <div className="col-span-2">
                  <Button 
                    type="button" 
                    onClick={addItem} 
                    className="w-full"
                    disabled={!currentItem.productId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview of current selection */}
              {currentItem.productId && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                  Selected: <strong>{getProductName(currentItem.productId)}</strong> - 
                  {currentItem.quantity} × {formatCurrency(currentItem.unitCost || 0)} = 
                  <strong> {formatCurrency((currentItem.quantity || 0) * (currentItem.unitCost || 0))}</strong>
                </div>
              )}

              {/* Items List */}
              {items.length > 0 && (
                <ScrollArea className="h-[150px] rounded-lg border p-3">
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {getProductName(item.productId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} x {formatCurrency(item.unitCost)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {formatCurrency(item.quantity * item.unitCost)}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {items.length === 0 && !currentItem.productId && (
                <div className="text-center py-6 text-muted-foreground border rounded-lg">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items added yet</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Delivery Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="shipping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes for this order..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Totals */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatCurrency(shipping)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || items.length === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
