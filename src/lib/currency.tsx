"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CurrencyContextType {
  symbol: string;
  code: string;
  format: (amount: number | string) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  symbol: "$",
  code: "USD",
  format: (amount) => `$${Number(amount).toFixed(2)}`,
  isLoading: true,
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [symbol, setSymbol] = useState("$");
  const [code, setCode] = useState("USD");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.currency_symbol) {
            setSymbol(data.currency_symbol);
          }
          if (data.currency) {
            setCode(data.currency);
          }
        }
      } catch (error) {
        console.error("Failed to fetch currency settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const format = (amount: number | string): string => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return `${symbol}0.00`;
    return `${symbol}${num.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ symbol, code, format, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

// Utility function for server components or when context is not available
export function formatCurrency(amount: number | string, symbol: string = "$"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toFixed(2)}`;
}

// Client component for displaying currency in server component pages
export function CurrencyAmount({ amount, className }: { amount: number | string; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(amount)}</span>;
}
