// GET/POST/DELETE /api/admin/users/[id]/inventory
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const { cardId, quantity } = await request.json();
    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    const qty = quantity || 1;

    await prisma.userInventory.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: { userId, cardId, quantity: qty },
      update: { quantity: { increment: qty } },
    });

    return NextResponse.json({ message: `Đã thêm ${qty}x thẻ #${cardId}` });
  } catch (error) {
    console.error('Admin add inventory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const { cardId } = await request.json();
    if (!cardId) {
      return NextResponse.json({ error: 'cardId is required' }, { status: 400 });
    }

    await prisma.userInventory.deleteMany({
      where: { userId, cardId },
    });

    return NextResponse.json({ message: `Đã xóa thẻ #${cardId} khỏi inventory` });
  } catch (error) {
    console.error('Admin delete inventory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
