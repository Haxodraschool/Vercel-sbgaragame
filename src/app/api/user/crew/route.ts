// GET /api/user/crew - Lấy crew đang sở hữu
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const crewCards = await prisma.userInventory.findMany({
      where: {
        userId: auth.userId,
        card: { type: 'CREW' },
      },
      include: {
        card: {
          include: {
            effects: true,
          },
        },
      },
    });

    // Get user crew slot info
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { crewSlots: true },
    });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      crew: crewCards.map((inv: any) => ({
        inventoryId: inv.id,
        quantity: inv.quantity,
        card: {
          id: inv.card.id,
          name: inv.card.name,
          rarity: inv.card.rarity,
          description: inv.card.description,
          unlockType: inv.card.unlockType,
          effects: inv.card.effects,
        },
      })),
      crewSlots: user?.crewSlots ?? 1,
      maxCrewSlots: 5,
      totalOwned: crewCards.length,
    });

  } catch (error) {
    console.error('User crew error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
