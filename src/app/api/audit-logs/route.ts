import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const entityType = searchParams.get("entityType") || undefined;
    const entityId = searchParams.get("entityId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const action = searchParams.get("action") as AuditAction | null || undefined;
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined;
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await getAuditLogs({
      entityType,
      entityId,
      userId,
      action,
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { message: "Error fetching audit logs" },
      { status: 500 }
    );
  }
}
