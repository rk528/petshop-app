import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Generate unique purchase number
function generatePurchaseNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `PO-${year}${month}-${random}`;
}

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        supplier: true,
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return NextResponse.json(
      { message: "Error fetching purchases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      supplierId,
      items,
      notes,
      expectedDate,
      shipping = 0,
      tax = 0,
    } = body;

    if (!supplierId) {
      return NextResponse.json(
        { message: "Supplier is required" },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { message: "At least one item is required" },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: { quantity: number; unitCost: number }) =>
        sum + item.quantity * item.unitCost,
      0
    );
    const total = subtotal + Number(tax) + Number(shipping);

    // Create purchase with items
    const purchase = await prisma.purchase.create({
      data: {
        purchaseNumber: generatePurchaseNumber(),
        supplierId,
        userId: session.user.id,
        subtotal,
        tax,
        shipping,
        total,
        notes,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        items: {
          create: items.map((item: {
            productId: string;
            variantId?: string;
            quantity: number;
            unitCost: number;
          }) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return NextResponse.json(
      { message: "Error creating purchase order" },
      { status: 500 }
    );
  }
}
