import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get currency symbol from settings
    const currencySetting = await prisma.setting.findUnique({
      where: { key: "currency_symbol" },
    });
    const currencySymbol = currencySetting?.value || "$";

    // Get low stock products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: {
          lte: prisma.product.fields.lowStockThreshold,
        },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
        unit: true,
      },
      orderBy: { stockQuantity: "asc" },
      take: 10,
    });

    // Get recent sales (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
      },
      select: {
        id: true,
        receiptNumber: true,
        total: true,
        createdAt: true,
        customerName: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Get pending purchase orders
    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        status: { in: ["PENDING", "ORDERED", "SHIPPED"] },
      },
      select: {
        id: true,
        purchaseNumber: true,
        status: true,
        total: true,
        supplier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Build notifications array
    const notifications: Array<{
      id: string;
      type: "low_stock" | "sale" | "purchase";
      title: string;
      message: string;
      urgent: boolean;
      link: string;
      createdAt: Date;
    }> = [];

    // Add low stock notifications
    lowStockProducts.forEach((product) => {
      const isCritical = product.stockQuantity <= 5;
      notifications.push({
        id: `stock-${product.id}`,
        type: "low_stock",
        title: isCritical ? "Critical Stock" : "Low Stock",
        message: `${product.name} has only ${product.stockQuantity} ${product.unit}${product.stockQuantity !== 1 ? "s" : ""} left`,
        urgent: isCritical,
        link: "/dashboard/low-stock",
        createdAt: new Date(),
      });
    });

    // Add recent sales notifications
    recentSales.forEach((sale) => {
      notifications.push({
        id: `sale-${sale.id}`,
        type: "sale",
        title: "New Sale",
        message: `${sale.receiptNumber} - ${currencySymbol}${Number(sale.total).toFixed(2)}${sale.customerName ? ` (${sale.customerName})` : ""}`,
        urgent: false,
        link: "/dashboard/sales",
        createdAt: sale.createdAt,
      });
    });

    // Add pending purchase notifications
    pendingPurchases.forEach((purchase) => {
      notifications.push({
        id: `purchase-${purchase.id}`,
        type: "purchase",
        title: `Purchase ${purchase.status.toLowerCase()}`,
        message: `${purchase.purchaseNumber} from ${purchase.supplier.name}`,
        urgent: false,
        link: "/dashboard/purchases",
        createdAt: new Date(),
      });
    });

    // Sort by urgency first, then by date
    notifications.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      notifications: notifications.slice(0, 15),
      counts: {
        lowStock: lowStockProducts.length,
        criticalStock: lowStockProducts.filter((p) => p.stockQuantity <= 5).length,
        recentSales: recentSales.length,
        pendingPurchases: pendingPurchases.length,
        total: notifications.length,
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
