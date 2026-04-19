// GET/PATCH/DELETE /api/admin/users/[id]
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse, serializeUser } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventory: {
          include: { card: { select: { id: true, name: true, type: true, rarity: true, cost: true } } },
          orderBy: { card: { id: 'asc' } },
        },
        achievements: {
          include: { achievement: true },
        },
        _count: {
          select: { dailyQuests: true, endings: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...serializeUser(user),
        inventory: user.inventory.map((inv) => ({
          id: inv.id,
          cardId: inv.cardId,
          quantity: inv.quantity,
          card: inv.card,
        })),
        achievements: user.achievements,
        questCount: user._count.dailyQuests,
        endingCount: user._count.endings,
      },
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const userId = parseInt(id);

  try {
    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      'gold', 'level', 'exp', 'currentDay', 'garageHealth',
      'techPoints', 'crewSlots', 'isFinalRound', 'role',
      'totalExplosions', 'totalPacksOpened',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Cập nhật thành công',
      user: serializeUser(user),
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  const { id } = await params;
  const userId = parseInt(id);

  try {
    // Prevent deleting yourself
    if (userId === admin.userId) {
      return NextResponse.json({ error: 'Không thể xóa chính mình!' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'Đã xóa tài khoản' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
