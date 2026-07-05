import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { message: "Coupon code required" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { message: "Coupon not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    if (!coupon.isActive) {
      return NextResponse.json(
        { message: "Coupon is not active" },
        { status: 400 }
      );
    }

    if (coupon.startDate > now) {
      return NextResponse.json(
        { message: "Coupon is not yet valid" },
        { status: 400 }
      );
    }

    if (coupon.endDate < now) {
      return NextResponse.json(
        { message: "Coupon has expired" },
        { status: 400 }
      );
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { message: "Coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { message: "Error validating coupon" },
      { status: 500 }
    );
  }
}
