// GET /api/achievements - List all achievements + unlock status
// POST /api/achievements - Check & auto-unlock earned achievements
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        achievements: { include: { achievement: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    const allAchievements = await prisma.achievement.findMany({
      include: { rewardCrew: { select: { id: true, name: true, rarity: true, description: true } } },
    });

    const unlockedIds = new Set(user.achievements.map((ua) => ua.achievementId));

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      achievements: allAchievements.map((a: any) => ({
        id: a.id,
        code: a.code,
        name: a.isHidden && !unlockedIds.has(a.id) ? '???' : a.name,
        description: a.isHidden && !unlockedIds.has(a.id) ? 'Thành tựu ẩn - Tự khám phá!' : a.description,
        isHidden: a.isHidden,
        unlocked: unlockedIds.has(a.id),
        achievedAt: user.achievements.find((ua) => ua.achievementId === a.id)?.achievedAt || null,
        rewardCrew: unlockedIds.has(a.id) || !a.isHidden ? a.rewardCrew : null,
      })),
      totalAchievements: allAchievements.length,
      unlockedCount: unlockedIds.size,
    });

  } catch (error) {
    console.error('Achievements list error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        achievements: true,
        inventory: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    const allAchievements = await prisma.achievement.findMany();
    const unlockedIds = new Set(user.achievements.map((ua) => ua.achievementId));
    const newlyUnlocked: string[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let earned = false;

      switch (achievement.conditionType) {
        case 'TOTAL_EXPLOSIONS':
          // Ghost Mechanic: 10 nổ máy
          earned = user.totalExplosions >= achievement.conditionValue;
          break;

        // Other conditions checked here...
        // HEAT_FULL_RUN_90: checked after workshop test (external trigger)
        // ZERO_COST_QUEST: checked after quest complete (external trigger)
        // SECRET_CLOCK: checked via /api/achievements/secret
        // SELL_ALL_LEGENDARY: checked after selling cards
      }

      if (earned) {
        await prisma.userAchievement.create({
          data: { userId: auth.userId, achievementId: achievement.id },
        });

        // Grant hidden crew card
        if (achievement.rewardCrewId) {
          await prisma.userInventory.upsert({
            where: { userId_cardId: { userId: auth.userId, cardId: achievement.rewardCrewId } },
            create: { userId: auth.userId, cardId: achievement.rewardCrewId, quantity: 1 },
            update: {},
          });
        }

        newlyUnlocked.push(achievement.name);
      }
    }

    return NextResponse.json({
      message: newlyUnlocked.length > 0
        ? `🏅 Mở khóa ${newlyUnlocked.length} thành tựu mới!`
        : 'Chưa có thành tựu mới.',
      newlyUnlocked,
      totalUnlocked: unlockedIds.size + newlyUnlocked.length,
    });

  } catch (error) {
    console.error('Achievement check error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
