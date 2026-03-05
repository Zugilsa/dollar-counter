import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeDecision } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const where = type ? { type } : {};

    const decisions = await prisma.decision.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(decisions.map(serializeDecision));
  } catch (error) {
    console.error('GET /api/decisions error:', error);
    return NextResponse.json({ error: 'Failed to fetch decisions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, note, monthlyCost, startDate, secondOrder, reclaim } = body;

    if (!type || !title || !startDate || reclaim === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const decision = await prisma.decision.create({
      data: {
        type,
        title,
        note: note ?? null,
        monthlyCost: monthlyCost ?? 0,
        startDate: new Date(startDate),
        secondOrder: secondOrder ? JSON.stringify(secondOrder) : null,
        reclaim: JSON.stringify(reclaim),
      },
    });

    return NextResponse.json(serializeDecision(decision), { status: 201 });
  } catch (error) {
    console.error('POST /api/decisions error:', error);
    return NextResponse.json({ error: 'Failed to create decision' }, { status: 500 });
  }
}
