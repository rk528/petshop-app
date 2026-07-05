"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Package,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  PawPrint,
  LayoutDashboard,
  LogOut,
  Ticket,
  User,
  X,
  ShoppingCart,
  Barcode,
} from "lucide-react";
import { toast } from "sonner";
import { CheckoutDialog } from "./checkout-dialog";
import { useCurrency } from "@/lib/currency";
import { useStoreSettings } from "@/lib/store-settings";
import { type Serialized } from "@/lib/utils";
import type { Product, Category, ProductVariant, Promotion, PromotionProduct } from "@prisma/client";
import type { UserRole } from "@prisma/client";

type ProductWithRelations = Serialized<Product & {
  category: Category;
  variants: ProductVariant[];
}>;

type PromotionWithProducts = Serialized<Promotion & {
  products: (PromotionProduct & { product: Product })[];
}>;

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  taxRate: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface POSTerminalProps {
  products: ProductWithRelations[];
  categories: Category[];
  promotions: PromotionWithProducts[];
  user: User;
}

export function POSTerminal({
  products,
  categories,
  promotions,
  user,
}: POSTerminalProps) {
  const router = useRouter();
  const { format: formatCurrency } = useCurrency();
  const { storeName } = useStoreSettings();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    maxDiscount?: number;
    minPurchase?: number;
  } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // Focus search on mount and after barcode scan
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle barcode scanner input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && search) {
        const product = products.find(
          (p) => p.barcode === search || p.sku === search
        );
        if (product) {
          addToCart(product);
          setSearch("");
        } else {
          // Check variants
          for (const product of products) {
            const variant = product.variants.find(
              (v) => v.barcode === search || v.sku === search
            );
            if (variant) {
              addToCart(product, variant);
              setSearch("");
              return;
            }
          }
          toast.error("Product not found", {
            description: `No product found with code: ${search}`,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search, products]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      search === "" ||
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode?.includes(search);

    const matchesCategory =
      selectedCategory === "all" || product.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const addToCart = useCallback((product: ProductWithRelations, variant?: Serialized<ProductVariant>) => {
    const itemId = variant ? `${product.id}-${variant.id}` : product.id;
    const price = variant
      ? Number(product.basePrice) + Number(variant.priceModifier)
      : Number(product.basePrice);

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === itemId);
      if (existingItem) {
        return prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          productId: product.id,
          variantId: variant?.id,
          name: product.name,
          variantName: variant?.name,
          price,
          quantity: 1,
          taxRate: Number(product.taxRate),
        },
      ];
    });

    toast.success("Added to cart", {
      description: `${product.name}${variant ? ` - ${variant.name}` : ""}`,
    });
  }, []);

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode("");
    setCustomerInfo({ name: "", phone: "", email: "" });
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const taxAmount = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity * item.taxRate) / 100,
    0
  );

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscount);
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const total = subtotal + taxAmount - discountAmount;

  const applyCoupon = async () => {
    if (!couponCode) return;

    try {
      const response = await fetch(`/api/coupons/validate?code=${couponCode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const coupon = await response.json();

      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        toast.error("Invalid coupon", {
          description: `Minimum purchase is ${formatCurrency(coupon.minPurchase)}`,
        });
        return;
      }

      setAppliedCoupon({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined,
        minPurchase: coupon.minPurchase ? Number(coupon.minPurchase) : undefined,
      });

      toast.success("Coupon applied", {
        description: `${coupon.description || coupon.code}`,
      });
    } catch (error) {
      toast.error("Invalid coupon", {
        description: error instanceof Error ? error.message : "Error validating coupon",
      });
    }
  };

  const handleCheckoutComplete = () => {
    clearCart();
    setCheckoutOpen(false);
    toast.success("Sale completed!", {
      description: "Receipt has been generated",
    });
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">{storeName} POS</h1>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Search and Categories */}
        <div className="p-4 space-y-4 border-b bg-muted/30">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search or scan barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-10 h-12 text-lg"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] h-12">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <ScrollArea className="flex-1 p-4">
          <div className="pos-grid">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No products found</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const hasVariants = product.variants.length > 0;
                const isLowStock = product.stockQuantity <= product.lowStockThreshold;

                return (
                  <Card
                    key={product.id}
                    className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${
                      isLowStock ? "border-destructive/50" : ""
                    }`}
                    onClick={() => !hasVariants && addToCart(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center mb-2 relative overflow-hidden">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                        )}
                        {isLowStock && (
                          <Badge
                            variant="destructive"
                            className="absolute top-1 right-1 text-[10px] px-1"
                          >
                            Low stock
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-primary">
                          {formatCurrency(product.basePrice)}
                        </span>
                        {hasVariants ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {product.variants.length} var.
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {product.stockQuantity} {product.unit}
                          </Badge>
                        )}
                      </div>
                      {hasVariants && (
                        <div className="mt-2 space-y-1">
                          {product.variants.slice(0, 3).map((variant) => (
                            <Button
                              key={variant.id}
                              variant="outline"
                              size="sm"
                              className="w-full h-7 text-xs justify-between"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, variant);
                              }}
                            >
                              <span>{variant.name}</span>
                              <span className="font-medium">
                                {formatCurrency(Number(product.basePrice) + Number(variant.priceModifier))}
                              </span>
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-[400px] border-l bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="font-semibold">Cart</h2>
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Customer Info */}
        <Button
          variant="ghost"
          className="mx-4 mt-2 justify-start text-muted-foreground"
          onClick={() => setCustomerSheetOpen(true)}
        >
          <User className="h-4 w-4 mr-2" />
          {customerInfo.name || "Add customer (optional)"}
        </Button>

        {/* Cart Items */}
        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Cart is empty</p>
              <p className="text-xs text-muted-foreground mt-1">
                Search or scan products to add them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-primary">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Coupon */}
        <div className="p-4 border-t">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{appliedCoupon.code}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button variant="outline" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="p-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Discount</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment Buttons */}
        <div className="p-4 border-t grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="h-14"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <Banknote className="h-5 w-5 mr-2" />
            Cash
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-14"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Card
          </Button>
        </div>
      </div>

      {/* Customer Sheet */}
      <Sheet open={customerSheetOpen} onOpenChange={setCustomerSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Customer Information</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="Customer name"
                value={customerInfo.name}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="Phone number"
                value={customerInfo.phone}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={customerInfo.email}
                onChange={(e) =>
                  setCustomerInfo({ ...customerInfo, email: e.target.value })
                }
              />
            </div>
            <Button className="w-full" onClick={() => setCustomerSheetOpen(false)}>
              Save
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        subtotal={subtotal}
        taxAmount={taxAmount}
        discountAmount={discountAmount}
        total={total}
        coupon={appliedCoupon}
        customerInfo={customerInfo}
        userId={user.id}
        onComplete={handleCheckoutComplete}
      />
    </div>
  );
}
