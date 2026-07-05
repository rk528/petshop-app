import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { message: "Error fetching product" },
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

    // Check if SKU already exists (excluding current product)
    if (data.sku) {
      const existingSku = await prisma.product.findFirst({
        where: { sku: data.sku, NOT: { id } },
      });

      if (existingSku) {
        return NextResponse.json(
          { message: "SKU already exists" },
          { status: 400 }
        );
      }
    }

    // Get current product for stock logging
    const currentProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description || null,
        image: data.image !== undefined ? (data.image || null) : undefined,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        basePrice: data.basePrice,
        costPrice: data.costPrice,
        taxRate: data.taxRate,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        unit: data.unit,
        isActive: data.isActive,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    // Log stock change if quantity changed
    if (currentProduct.stockQuantity !== data.stockQuantity) {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          userId: session.user.id,
          action: "ADJUSTMENT",
          quantityChange: data.stockQuantity - currentProduct.stockQuantity,
          previousQuantity: currentProduct.stockQuantity,
          newQuantity: data.stockQuantity,
          reason: "Manual inventory adjustment",
        },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { message: "Error updating product" },
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

    // Check if product has sales
    const salesCount = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      // Soft delete - just mark as inactive
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: "Product deactivated (has associated sales)",
      });
    }

    // Hard delete if no sales
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { message: "Error deleting product" },
      { status: 500 }
    );
  }
}
