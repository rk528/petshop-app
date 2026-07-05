import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        contactName: data.contactName || null,
        notes: data.notes || null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { message: "Error updating supplier" },
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if supplier has products
    const productsCount = await prisma.product.count({
      where: { supplierId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { message: "Cannot delete: supplier has associated products" },
        { status: 400 }
      );
    }

    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Supplier deleted" });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { message: "Error deleting supplier" },
      { status: 500 }
    );
  }
}
