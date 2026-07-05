"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CurrencyProvider } from "@/lib/currency";
import { StoreSettingsProvider } from "@/lib/store-settings";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <StoreSettingsProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </StoreSettingsProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
