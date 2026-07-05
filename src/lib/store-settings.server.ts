import prisma from "@/lib/prisma";

// Server-side function to get store settings
export async function getStoreSettings() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return {
      storeName: settingsMap.store_name || "Pet Shop",
      storeAddress: settingsMap.store_address || "",
      storePhone: settingsMap.store_phone || "",
      storeEmail: settingsMap.store_email || "",
      receiptFooter: settingsMap.receipt_footer || "Thank you for your purchase!",
    };
  } catch {
    // Return defaults if database is not available
    return {
      storeName: "Pet Shop",
      storeAddress: "",
      storePhone: "",
      storeEmail: "",
      receiptFooter: "Thank you for your purchase!",
    };
  }
}
