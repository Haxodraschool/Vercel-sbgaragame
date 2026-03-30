// POST /api/game/final-round - Bước vào Final Round
// GET /api/game/check-ending - Kiểm tra điều kiện ending
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        endings: {
          include: { ending: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Get all endings and mark which ones are unlocked
    const allEndings = await prisma.ending.findMany();
    const unlockedIds = new Set(user.endings.map((ue) => ue.endingId));

    return NextResponse.json({
      endings: allEndings.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        description: unlockedIds.has(e.id) ? e.description : '???',
        unlocked: unlockedIds.has(e.id),
        achievedAt: user.endings.find((ue) => ue.endingId === e.id)?.achievedAt || null,
      })),
      totalEndings: allEndings.length,
      unlockedCount: unlockedIds.size,
    });

  } catch (error) {
    console.error('Check ending error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

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

    if (user.currentDay <= GAME_CONSTANTS.MAX_DAY) {
      return NextResponse.json(
        { error: 'Chưa đủ điều kiện vào Final Round (cần qua Ngày 50)' },
        { status: 400 }
      );
    }

    if (user.isFinalRound) {
      return NextResponse.json(
        { error: 'Đã đang ở trong Final Round' },
        { status: 400 }
      );
    }

    // Set final round flag
    await prisma.user.update({
      where: { id: auth.userId },
      data: { isFinalRound: true, currentDay: 51 },
    });

    // Generate 10 boss quests for Final Round
    const bosses = await prisma.bossConfig.findMany();
    const shuffledBosses = bosses.sort(() => Math.random() - 0.5);
    const finalBosses = shuffledBosses.slice(0, GAME_CONSTANTS.FINAL_ROUND_BOSSES);

    // Create quests (all bosses on day 51 = Final Round)
    await prisma.dailyQuest.createMany({
      data: finalBosses.map((boss) => ({
        userId: auth.userId,
        dayNumber: 51,
        isBoss: true,
        bossConfigId: boss.id,
        requiredPower: boss.requiredPower,
        rewardGold: boss.rewardGold * 2, // Double reward in final round
        status: 'PENDING' as const,
      })),
    });

    return NextResponse.json({
      message: '🔥 FINAL ROUND! 10 Boss mạnh nhất đang chờ bạn trên Sofa!',
      isFinalRound: true,
      totalBosses: finalBosses.length,
      bosses: finalBosses.map((b) => ({
        name: b.name,
        description: b.description,
        specialCondition: b.specialCondition,
        requiredPower: b.requiredPower,
      })),
    });

  } catch (error) {
    console.error('Final round error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
