import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper to serialize a Decision from Prisma (String JSON fields) to frontend format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serializeDecision(d: any) {
  return {
    id: d.id,
    type: d.type,
    title: d.title,
    note: d.note,
    monthlyCost: d.monthlyCost,
    startDate: d.startDate instanceof Date ? d.startDate.toISOString() : d.startDate,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt,
    secondOrder: d.secondOrder ? (typeof d.secondOrder === 'string' ? JSON.parse(d.secondOrder) : d.secondOrder) : null,
    reclaim: typeof d.reclaim === 'string' ? JSON.parse(d.reclaim) : d.reclaim,
  };
}
