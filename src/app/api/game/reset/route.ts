// POST /api/game/reset - Reset game mới (Roguelite new run)
// Giữ tech_points, xóa inventory/quests/events, reset stats
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Xóa dữ liệu vòng chơi cũ
    await prisma.dailyQuest.deleteMany({ where: { userId: auth.userId } });
    await prisma.userActiveEvent.deleteMany({ where: { userId: auth.userId } });
    await prisma.userInventory.deleteMany({ where: { userId: auth.userId } });

    // Reset stats nhưng GIỮ tech_points, crew_slots, endings, totalShopSpent
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        gold: 500,
        level: 1,
        exp: 0,
        currentDay: 1,
        garageHealth: 100,
        isFinalRound: false,
        activePerkCode: null, // Reset perk cho phép chọn lại
        // Reset NK + boss flags
        smugglerPenalty: 0,
        hasDefeatedEP: false,
        shopTaxModifier: 1.0,
        shopTaxExpiresAt: 0,
        isInNorthKorea: false,
        northKoreaDayCount: 0,
        hasKimBuff: false,
        hasUnderworldBuff: false,
        lastSmugglerBuyDay: 0,
        isKimAssassinated: false,
        hasDefeatedDonaldTrump: false,
        hasMoscowBuff: false,
        moscowBuffDay: 0,
        // GIỮ: techPoints, crewSlots, totalExplosions, totalShopSpent (Roguelite progression)
      },
    });

    // Tặng lại starter cards
    const starterCards = await prisma.card.findMany({
      where: { rarity: 1 },
      take: 10,
    });

    if (starterCards.length > 0) {
      await prisma.userInventory.createMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: starterCards.map((card: any) => ({
          userId: auth.userId,
          cardId: card.id,
          quantity: 2,
        })),
      });
    }

    return NextResponse.json({
      message: '🔄 Game reset! Vòng chơi mới bắt đầu. Tech Points và Crew Slots được giữ lại!',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        gold: Number(updatedUser.gold),
        level: updatedUser.level,
        currentDay: updatedUser.currentDay,
        garageHealth: updatedUser.garageHealth,
        techPoints: Number(updatedUser.techPoints),
        crewSlots: updatedUser.crewSlots,
        isFinalRound: false,
      },
    });

  } catch (error) {
    console.error('Game reset error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
