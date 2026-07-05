"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";

const promotionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountValue: z.number().min(0.01, "Discount value must be greater than 0"),
  minPurchase: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  productIds: z.array(z.string()),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type PromotionFormValues = z.infer<typeof promotionSchema>;

interface Product {
  id: string;
  name: string;
  sku: string;
  basePrice: number;
}

interface PromotionProduct {
  productId: string;
}

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  minPurchase: number | null;
  maxDiscount: number | null;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  products: PromotionProduct[];
}

interface PromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  promotion?: Promotion | null;
}

export function PromotionDialog({
  open,
  onOpenChange,
  products,
  promotion,
}: PromotionDialogProps) {
  const router = useRouter();
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!promotion;

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minPurchase: null,
      maxDiscount: null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
      productIds: [],
    },
  });

  // Reset form when dialog opens or promotion changes
  useEffect(() => {
    if (open) {
      if (promotion) {
        form.reset({
          name: promotion.name,
          description: promotion.description || "",
          discountType: promotion.discountType,
          discountValue: Number(promotion.discountValue),
          minPurchase: promotion.minPurchase ? Number(promotion.minPurchase) : null,
          maxDiscount: promotion.maxDiscount ? Number(promotion.maxDiscount) : null,
          startDate: new Date(promotion.startDate),
          endDate: new Date(promotion.endDate),
          isActive: promotion.isActive,
          productIds: promotion.products.map((p) => p.productId),
        });
      } else {
        form.reset({
          name: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 10,
          minPurchase: null,
          maxDiscount: null,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          isActive: true,
          productIds: [],
        });
      }
    }
  }, [open, promotion, form]);

  const discountType = form.watch("discountType");

  async function onSubmit(data: PromotionFormValues) {
    setIsLoading(true);
    try {
      const url = isEditing ? `/api/promotions/${promotion.id}` : "/api/promotions";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          minPurchase: data.minPurchase || null,
          maxDiscount: data.maxDiscount || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${isEditing ? "updating" : "creating"} promotion`);
      }

      toast.success(isEditing ? "Promotion updated" : "Promotion created", {
        description: `${data.name} has been ${isEditing ? "updated" : "created"} successfully`,
      });

      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Promotion" : "New Promotion"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Promotion Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Sale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this promotion..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount ({currencySymbol})</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Discount Value {discountType === "PERCENTAGE" ? "(%)" : `(${currencySymbol})`}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                        min="0"
                        max={discountType === "PERCENTAGE" ? "100" : undefined}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minPurchase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Purchase ({currencySymbol})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Optional"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormDescription>Leave empty for no minimum</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {discountType === "PERCENTAGE" && (
                <FormField
                  control={form.control}
                  name="maxDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Discount ({currencySymbol})</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Optional"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>Cap the discount amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < form.getValues("startDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="productIds"
              render={() => (
                <FormItem>
                  <FormLabel>Apply to Products</FormLabel>
                  <FormDescription>
                    Select products for this promotion. Leave empty to apply to all products.
                  </FormDescription>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    <div className="space-y-2">
                      {products.map((product) => (
                        <FormField
                          key={product.id}
                          control={form.control}
                          name="productIds"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(product.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, product.id]);
                                    } else {
                                      field.onChange(current.filter((id) => id !== product.id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="flex-1 flex items-center justify-between">
                                <span className="text-sm font-medium">{product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(product.basePrice)}
                                </span>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Active Promotion</FormLabel>
                    <FormDescription>
                      Inactive promotions won't be applied at checkout
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Promotion"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
