"use client";

import { format } from "date-fns";
import { useStoreSettings } from "@/lib/store-settings";

interface CartItem {
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
}

interface ReceiptPreviewProps {
  receiptNumber: string;
  cart: CartItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  currencySymbol?: string;
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  DIGITAL_WALLET: "Digital Wallet",
  BANK_TRANSFER: "Bank Transfer",
  MIXED: "Mixed",
};

export function ReceiptPreview({
  receiptNumber,
  cart,
  subtotal,
  taxAmount,
  discountAmount,
  total,
  amountPaid,
  change,
  paymentMethod,
  customerInfo,
  currencySymbol = "$",
}: ReceiptPreviewProps) {
  const { storeName, storeAddress, storePhone } = useStoreSettings();
  const fmt = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;
  return (
    <div className="receipt font-mono text-xs p-4 bg-white text-black rounded-lg border">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="font-bold text-lg">🐾 {storeName}</h3>
        {storeAddress && <p>{storeAddress}</p>}
        {storePhone && <p>Tel: {storePhone}</p>}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Receipt Info */}
      <div className="mb-4">
        <p>
          <span className="font-bold">Receipt:</span> {receiptNumber}
        </p>
        <p>
          <span className="font-bold">Date:</span>{" "}
          {format(new Date(), "MM/dd/yyyy HH:mm")}
        </p>
        {customerInfo.name && (
          <p>
            <span className="font-bold">Customer:</span> {customerInfo.name}
          </p>
        )}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Items */}
      <div className="mb-4">
        {cart.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1">
                {item.name}
                {item.variantName && ` (${item.variantName})`}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>
                {item.quantity} x {fmt(item.price)}
              </span>
              <span>{fmt(item.quantity * item.price)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Totals */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{fmt(taxAmount)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount:</span>
            <span>-{fmt(discountAmount)}</span>
          </div>
        )}
        <div className="border-t border-dashed my-2" />
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL:</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed my-2" />

      {/* Payment Info */}
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Payment method:</span>
          <span>{paymentMethodLabels[paymentMethod] || paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount paid:</span>
          <span>{fmt(amountPaid)}</span>
        </div>
        {change > 0 && (
          <div className="flex justify-between font-bold">
            <span>Change:</span>
            <span>{fmt(change)}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed my-4" />

      {/* Footer */}
      <div className="text-center">
        <p className="font-bold">Thank you for your purchase! 🐾</p>
        <p className="text-gray-600 mt-1">
          Come back soon to {storeName}
        </p>
      </div>
    </div>
  );
}
