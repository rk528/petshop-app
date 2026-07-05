import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logCreate } from "@/lib/audit";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      include: {
        products: {
          include: { product: true },
        },
        _count: {
          select: { sales: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(promotions);
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json(
      { message: "Error fetching promotions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.discountType || data.discountValue === undefined) {
      return NextResponse.json(
        { message: "Name, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    // Create promotion with optional product associations
    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase || null,
        maxDiscount: data.maxDiscount || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
        products: data.productIds?.length > 0
          ? {
              create: data.productIds.map((productId: string) => ({
                productId,
              })),
            }
          : undefined,
      },
      include: {
        products: {
          include: { product: true },
        },
      },
    });

    // Log the creation
    await logCreate(
      "Promotion",
      promotion.id,
      {
        ...promotion,
        productIds: promotion.products.map((p) => p.productId),
      },
      {
        userId: session.user.id,
        userName: session.user.name,
        entityName: promotion.name,
      }
    );

    return NextResponse.json(promotion, { status: 201 });
  } catch (error) {
    console.error("Error creating promotion:", error);
    return NextResponse.json(
      { message: "Error creating promotion" },
      { status: 500 }
    );
  }
}
