import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Prisma } from "@prisma/client"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Type utility to convert Prisma Decimal fields to number.
 * Recursively transforms all Decimal types in a type to number.
 */
export type Serialized<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
  ? Date
  : T extends (infer U)[]
  ? Serialized<U>[]
  : T extends object
  ? { [K in keyof T]: Serialized<T[K]> }
  : T;

/**
 * Serialize Prisma data for Client Components.
 * Converts Decimal objects to numbers and handles Date serialization.
 */
export function serialize<T>(data: T): Serialized<T> {
  return JSON.parse(JSON.stringify(data, (_, value) =>
    typeof value === 'object' && value !== null && 'toNumber' in value
      ? Number(value)
      : value
  ));
}
