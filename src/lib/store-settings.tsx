"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  receiptFooter: string;
  isLoading: boolean;
}

const defaultSettings: StoreSettings = {
  storeName: "Pet Shop",
  storeAddress: "",
  storePhone: "",
  storeEmail: "",
  receiptFooter: "Thank you for your purchase!",
  isLoading: true,
};

const StoreSettingsContext = createContext<StoreSettings>(defaultSettings);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings({
            storeName: data.store_name || "Pet Shop",
            storeAddress: data.store_address || "",
            storePhone: data.store_phone || "",
            storeEmail: data.store_email || "",
            receiptFooter: data.receipt_footer || "Thank you for your purchase!",
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch store settings:", error);
        setSettings((prev) => ({ ...prev, isLoading: false }));
      }
    }
    fetchSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return context;
}
