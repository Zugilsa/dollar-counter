import { NextRequest, NextResponse } from 'next/server';
import { prisma, serializeDecision } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: Record<string, any> = {};

    if (body.type !== undefined) data.type = body.type;
    if (body.title !== undefined) data.title = body.title;
    if (body.note !== undefined) data.note = body.note;
    if (body.monthlyCost !== undefined) data.monthlyCost = body.monthlyCost;
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate);
    if (body.secondOrder !== undefined) data.secondOrder = body.secondOrder ? JSON.stringify(body.secondOrder) : null;
    if (body.reclaim !== undefined) data.reclaim = JSON.stringify(body.reclaim);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields provided' }, { status: 400 });
    }

    const decision = await prisma.decision.update({ where: { id }, data });
    return NextResponse.json(serializeDecision(decision));
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update decision' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.decision.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2025') {
      return NextResponse.json({ error: 'Decision not found' }, { status: 404 });
    }
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete decision' }, { status: 500 });
  }
}
