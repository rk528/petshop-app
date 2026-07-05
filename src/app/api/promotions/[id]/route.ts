import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logUpdate, logDelete } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        products: {
          include: { product: true },
        },
      },
    });

    if (!promotion) {
      return NextResponse.json(
        { message: "Promotion not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return NextResponse.json(
      { message: "Error fetching promotion" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    // Get previous data for audit log
    const previousPromotion = await prisma.promotion.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!previousPromotion) {
      return NextResponse.json(
        { message: "Promotion not found" },
        { status: 404 }
      );
    }

    // First, delete existing product associations if productIds is provided
    if (data.productIds !== undefined) {
      await prisma.promotionProduct.deleteMany({
        where: { promotionId: id },
      });
    }

    // Update the promotion
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minPurchase: data.minPurchase || null,
        maxDiscount: data.maxDiscount || null,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isActive: data.isActive,
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

    // Log the update
    await logUpdate(
      "Promotion",
      id,
      {
        ...previousPromotion,
        productIds: previousPromotion.products.map((p) => p.productId),
      },
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

    return NextResponse.json(promotion);
  } catch (error) {
    console.error("Error updating promotion:", error);
    return NextResponse.json(
      { message: "Error updating promotion" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get previous data for audit log
    const previousPromotion = await prisma.promotion.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!previousPromotion) {
      return NextResponse.json(
        { message: "Promotion not found" },
        { status: 404 }
      );
    }

    // Delete associated products first (cascade should handle this, but being explicit)
    await prisma.promotionProduct.deleteMany({
      where: { promotionId: id },
    });

    await prisma.promotion.delete({
      where: { id },
    });

    // Log the deletion
    await logDelete(
      "Promotion",
      id,
      {
        ...previousPromotion,
        productIds: previousPromotion.products.map((p) => p.productId),
      },
      {
        userId: session.user.id,
        userName: session.user.name,
        entityName: previousPromotion.name,
      }
    );

    return NextResponse.json({ message: "Promotion deleted" });
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return NextResponse.json(
      { message: "Error deleting promotion" },
      { status: 500 }
    );
  }
}
