"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Banknote,
  CreditCard,
  Wallet,
  Printer,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { ReceiptPreview } from "./receipt-preview";
import { useCurrency } from "@/lib/currency";

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

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  coupon: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  userId: string;
  onComplete: () => void;
}

const quickAmounts = [20, 50, 100, 200];

export function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  subtotal,
  taxAmount,
  discountAmount,
  total,
  coupon,
  customerInfo,
  userId,
  onComplete,
}: CheckoutDialogProps) {
  const router = useRouter();
  const { format: formatCurrency, symbol: currencySymbol } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [amountPaid, setAmountPaid] = useState<string>(total.toFixed(2));
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<{
    receiptNumber: string;
    change: number;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const paidAmount = parseFloat(amountPaid) || 0;
  const change = Math.max(0, paidAmount - total);
  const isInsufficientAmount = paymentMethod === "CASH" && paidAmount < total - 0.001; // Allow for floating point precision

  const handlePayment = async () => {
    if (isInsufficientAmount) {
      toast.error("Insufficient amount", {
        description: "Amount paid must be greater than or equal to total",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.name,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.price,
            taxRate: item.taxRate,
          })),
          subtotal,
          taxAmount,
          discountAmount,
          total,
          paymentMethod,
          amountPaid: paidAmount,
          changeGiven: change,
          couponCode: coupon?.code,
          customerName: customerInfo.name || null,
          customerPhone: customerInfo.phone || null,
          customerEmail: customerInfo.email || null,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401 && error.forceLogout) {
          toast.error("Session expired", {
            description: "Signing out and redirecting to login...",
          });
          await signOut({ callbackUrl: "/login" });
          return;
        }
        throw new Error(error.message || "Error processing sale");
      }

      const sale = await response.json();

      setCompletedSale({
        receiptNumber: sale.receiptNumber,
        change,
      });

      toast.success("Sale completed!", {
        description: `Receipt: ${sale.receiptNumber}`,
      });
    } catch (error) {
      toast.error("Sale error", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt</title>
              <style>
                body { font-family: monospace; font-size: 12px; padding: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .border-t { border-top: 1px dashed #000; margin: 8px 0; }
                .flex { display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleClose = () => {
    if (completedSale) {
      onComplete();
      setCompletedSale(null);
      setAmountPaid(total.toFixed(2));
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {completedSale ? "✅ Sale Completed" : "Process Payment"}
          </DialogTitle>
        </DialogHeader>

        {completedSale ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-primary" />
              </div>
              <p className="font-bold text-lg">Receipt: {completedSale.receiptNumber}</p>
              {completedSale.change > 0 && (
                <p className="text-2xl font-bold text-primary mt-2">
                  Change: {formatCurrency(completedSale.change)}
                </p>
              )}
            </div>

            <div ref={receiptRef}>
              <ReceiptPreview
                receiptNumber={completedSale.receiptNumber}
                cart={cart}
                subtotal={subtotal}
                taxAmount={taxAmount}
                discountAmount={discountAmount}
                total={total}
                amountPaid={parseFloat(amountPaid)}
                change={completedSale.change}
                paymentMethod={paymentMethod}
                customerInfo={customerInfo}
                currencySymbol={currencySymbol}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                New Sale
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-2 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <RadioGroupItem
                    value="CASH"
                    id="cash"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Banknote className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Cash</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="CARD"
                    id="card"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Card</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="DIGITAL_WALLET"
                    id="wallet"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="wallet"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Wallet className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">Digital</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Amount Paid (for cash) */}
            {paymentMethod === "CASH" && (
              <div className="space-y-3">
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="text-2xl h-14 text-center font-bold"
                />
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setAmountPaid(amount.toString())}
                    >
                      {currencySymbol}{amount}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setAmountPaid(total.toFixed(2))}
                >
                  Exact amount ({formatCurrency(total)})
                </Button>
                {!isInsufficientAmount && (
                  <div className="text-center p-3 rounded-lg bg-primary/10">
                    <span className="text-sm text-muted-foreground">Change:</span>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(change)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Button */}
            <Button
              className="w-full h-12 text-lg"
              disabled={isProcessing || isInsufficientAmount}
              onClick={handlePayment}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
