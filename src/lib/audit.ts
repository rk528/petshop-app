import prisma from "./prisma";
import { AuditAction, Prisma } from "@prisma/client";

interface AuditLogParams {
  userId?: string;
  userName?: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  action: AuditAction;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Get the list of fields that changed between two objects
 */
function getChangedFields(
  previous: Record<string, unknown> | null | undefined,
  current: Record<string, unknown> | null | undefined
): string[] {
  if (!previous && !current) return [];
  if (!previous) return Object.keys(current || {});
  if (!current) return Object.keys(previous);

  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);
  const changedFields: string[] = [];

  for (const key of allKeys) {
    // Skip internal fields
    if (["createdAt", "updatedAt", "id"].includes(key)) continue;

    const prevValue = JSON.stringify(previous[key]);
    const currValue = JSON.stringify(current[key]);

    if (prevValue !== currValue) {
      changedFields.push(key);
    }
  }

  return changedFields;
}

/**
 * Clean data for storage - remove sensitive fields and convert Decimals
 */
function cleanDataForAudit(data: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!data) return null;

  const cleaned: Record<string, unknown> = {};
  const sensitiveFields = ["password", "token", "secret"];

  for (const [key, value] of Object.entries(data)) {
    // Skip sensitive fields
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f))) {
      cleaned[key] = "[REDACTED]";
      continue;
    }

    // Convert Decimal to number
    if (value && typeof value === "object" && "toNumber" in value) {
      cleaned[key] = Number(value);
      continue;
    }

    // Handle Date objects
    if (value instanceof Date) {
      cleaned[key] = value.toISOString();
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  userId,
  userName,
  entityType,
  entityId,
  entityName,
  action,
  previousData,
  newData,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<void> {
  try {
    const cleanedPrevious = cleanDataForAudit(previousData);
    const cleanedNew = cleanDataForAudit(newData);
    const changedFields = getChangedFields(cleanedPrevious, cleanedNew);

    await prisma.auditLog.create({
      data: {
        userId,
        userName,
        entityType,
        entityId,
        entityName,
        action,
        previousData: cleanedPrevious as Prisma.InputJsonValue ?? Prisma.DbNull,
        newData: cleanedNew as Prisma.InputJsonValue ?? Prisma.DbNull,
        changedFields,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break the main operation
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Log a CREATE action
 */
export async function logCreate(
  entityType: string,
  entityId: string,
  newData: Record<string, unknown>,
  options: {
    userId?: string;
    userName?: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  await createAuditLog({
    ...options,
    entityType,
    entityId,
    action: "CREATE",
    previousData: null,
    newData,
  });
}

/**
 * Log an UPDATE action
 */
export async function logUpdate(
  entityType: string,
  entityId: string,
  previousData: Record<string, unknown>,
  newData: Record<string, unknown>,
  options: {
    userId?: string;
    userName?: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  await createAuditLog({
    ...options,
    entityType,
    entityId,
    action: "UPDATE",
    previousData,
    newData,
  });
}

/**
 * Log a DELETE action
 */
export async function logDelete(
  entityType: string,
  entityId: string,
  previousData: Record<string, unknown>,
  options: {
    userId?: string;
    userName?: string;
    entityName?: string;
    ipAddress?: string;
    userAgent?: string;
  } = {}
): Promise<void> {
  await createAuditLog({
    ...options,
    entityType,
    entityId,
    action: "DELETE",
    previousData,
    newData: null,
  });
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
} = {}) {
  const {
    entityType,
    entityId,
    userId,
    action,
    startDate,
    endDate,
    page = 1,
    limit = 50,
  } = options;

  const where: Record<string, unknown> = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, Date>).gte = startDate;
    if (endDate) (where.createdAt as Record<string, Date>).lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
