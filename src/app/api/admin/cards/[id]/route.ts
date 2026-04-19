// GET/PATCH/DELETE /api/admin/cards/[id]
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;

  try {
    const card = await prisma.card.findUnique({
      where: { id: parseInt(id) },
      include: { effects: true },
    });

    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Admin get card error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;

  try {
    const body = await request.json();
    const allowedFields = [
      'name', 'type', 'rarity', 'statPower', 'statHeat', 'statStability',
      'cost', 'description', 'imageUrl', 'unlockType',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const card = await prisma.card.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { effects: true },
    });

    return NextResponse.json({ message: 'Cập nhật thẻ thành công', card });
  } catch (error) {
    console.error('Admin update card error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;

  try {
    await prisma.card.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ message: 'Đã xóa thẻ' });
  } catch (error) {
    console.error('Admin delete card error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
