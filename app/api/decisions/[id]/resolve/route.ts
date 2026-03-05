import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeDecision } from '@/lib/db';

interface ReclaimConfig {
  enabled: boolean;
  targetDate: string;
  resolvedDate: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { resolvedDate } = body;

    if (!resolvedDate || typeof resolvedDate !== 'string') {
      return NextResponse.json({ error: '"resolvedDate" is required' }, { status: 400 });
    }

    const parsed = new Date(resolvedDate);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const existing = await prisma.decision.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }

    const currentReclaim: ReclaimConfig = typeof existing.reclaim === 'string'
      ? JSON.parse(existing.reclaim)
      : existing.reclaim as ReclaimConfig;

    if (!currentReclaim?.enabled) {
      return NextResponse.json({ error: 'Reclaim not enabled' }, { status: 400 });
    }

    const updatedReclaim: ReclaimConfig = { ...currentReclaim, resolvedDate };

    const decision = await prisma.decision.update({
      where: { id },
      data: { reclaim: JSON.stringify(updatedReclaim) },
    });

    return NextResponse.json(serializeDecision(decision));
  } catch (error) {
    console.error('POST resolve error:', error);
    return NextResponse.json({ error: 'Failed to resolve decision' }, { status: 500 });
  }
}
