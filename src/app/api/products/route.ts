import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { message: "Error fetching products" },
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

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingSku) {
      return NextResponse.json(
        { message: "SKU already exists" },
        { status: 400 }
      );
    }

    // Check if barcode already exists (if provided)
    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode: data.barcode },
      });

      if (existingBarcode) {
        return NextResponse.json(
          { message: "Barcode already exists" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        description: data.description || null,
        image: data.image || null,
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

    // Create inventory log for initial stock
    if (data.stockQuantity > 0) {
      await prisma.inventoryLog.create({
        data: {
          productId: product.id,
          userId: session.user.id,
          action: "ADJUSTMENT",
          quantityChange: data.stockQuantity,
          previousQuantity: 0,
          newQuantity: data.stockQuantity,
          reason: "Initial product stock",
        },
      });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { message: "Error creating product" },
      { status: 500 }
    );
  }
}
