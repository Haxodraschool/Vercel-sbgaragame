import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { tpAmount } = body;

    if (!tpAmount || typeof tpAmount !== 'number' || tpAmount <= 0) {
      return NextResponse.json({ error: 'Số lượng TP không hợp lệ' }, { status: 400 });
    }

    const goldCost = tpAmount * 500;

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { gold: true, techPoints: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.gold < goldCost) {
      return NextResponse.json({ error: 'Không đủ vàng' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        gold: { decrement: goldCost },
        techPoints: { increment: tpAmount },
      },
      select: { gold: true, techPoints: true },
    });

    return NextResponse.json({
      message: `Đổi thành công ${tpAmount} Tech Points!`,
      gold: Number(updatedUser.gold),
      techPoints: updatedUser.techPoints,
    });
  } catch (error: any) {
    console.error('Buy TP Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
