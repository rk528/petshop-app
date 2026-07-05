import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        coupon: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { message: "Error fetching sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Validate user exists in database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Session expired. Please log in again.", redirect: "/login", forceLogout: true },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Generate receipt number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.sale.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
        },
      },
    });
    const receiptNumber = `RCP-${dateStr}-${String(count + 1).padStart(4, "0")}`;

    // Validate and get coupon if provided
    let couponId = null;
    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode },
      });
      if (coupon) {
        couponId = coupon.id;
        // Update coupon usage
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Validate all products exist
    const productIds = data.items.map((item: { productId: string }) => item.productId);
    const existingProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    
    if (existingProducts.length !== productIds.length) {
      return NextResponse.json(
        { message: "One or more products not found" },
        { status: 400 }
      );
    }

    // Create sale with items - use session user instead of client-provided userId
    const sale = await prisma.sale.create({
      data: {
        receiptNumber,
        userId: session.user.id,
        couponId,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount || 0,
        taxAmount: data.taxAmount,
        total: data.total,
        paymentMethod: data.paymentMethod,
        amountPaid: data.amountPaid,
        changeGiven: data.changeGiven || 0,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        items: {
          create: data.items.map((item: {
            productId: string;
            variantId?: string;
            productName: string;
            variantName?: string;
            quantity: number;
            unitPrice: number;
            taxRate: number;
          }) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            productName: item.productName,
            variantName: item.variantName || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: 0,
            taxRate: item.taxRate,
            taxAmount: (item.unitPrice * item.quantity * item.taxRate) / 100,
            total: item.unitPrice * item.quantity * (1 + item.taxRate / 100),
          })),
        },
      },
      include: {
        items: true,
        user: { select: { name: true } },
      },
    });

    // Update inventory and create logs
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product) {
        const newQuantity = product.stockQuantity - item.quantity;

        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newQuantity },
        });

        await prisma.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            userId: session.user.id,
            action: "SALE",
            quantityChange: -item.quantity,
            previousQuantity: product.stockQuantity,
            newQuantity,
            referenceType: "sale",
            referenceId: sale.id,
          },
        });
      }

      // Also update variant stock if applicable
      if (item.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (variant) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stockQuantity: variant.stockQuantity - item.quantity },
          });
        }
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: `Error processing sale: ${errorMessage}` },
      { status: 500 }
    );
  }
}
