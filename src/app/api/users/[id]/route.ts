import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can update users
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const data = await request.json();
    const { email, name, password, role, isActive } = data;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // MANAGER restrictions:
    // 1. Can only edit CASHIER users
    // 2. Can only set role to CASHIER
    if (session.user.role === "MANAGER") {
      if (currentUser.role !== "CASHIER") {
        return NextResponse.json(
          { message: "Managers can only edit Cashier users" },
          { status: 403 }
        );
      }
      if (role && role !== "CASHIER") {
        return NextResponse.json(
          { message: "Managers can only assign Cashier role" },
          { status: 403 }
        );
      }
    }

    // Prevent user from changing their own role (unless ADMIN)
    if (id === session.user.id && role && role !== session.user.role) {
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { message: "You cannot change your own role" },
          { status: 403 }
        );
      }
    }

    // Check if email is being changed and if it already exists
    if (email && email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        return NextResponse.json(
          { message: "A user with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      email?: string;
      name?: string;
      password?: string;
      role?: "ADMIN" | "MANAGER" | "CASHIER";
      isActive?: boolean;
    } = {};

    if (email) updateData.email = email;
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (password) {
      updateData.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
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
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN can delete users
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only administrators can delete users" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: { select: { sales: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // If user has sales, deactivate instead of delete
    if (user._count.sales > 0) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "User deactivated (has associated sales)",
        deactivated: true,
      });
    }

    // Delete user if no sales
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Error deleting user" },
      { status: 500 }
    );
  }
}
