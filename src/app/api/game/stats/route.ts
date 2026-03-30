// GET /api/game/stats - Thống kê tổng hợp người chơi
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const userId = auth.userId;

    const [
      user,
      totalQuests,
      successQuests,
      failedQuests,
      bossQuests,
      bossWins,
      endingsCount,
      achievementsCount,
      inventoryCount,
      legendaryCount,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          gold: true,
          level: true,
          exp: true,
          currentDay: true,
          garageHealth: true,
          techPoints: true,
          crewSlots: true,
          totalExplosions: true,
          totalShopSpent: true,
          isFinalRound: true,
          isInNorthKorea: true,
          hasDefeatedEP: true,
          hasDefeatedDonaldTrump: true,
          isKimAssassinated: true,
          activePerkCode: true,
        },
      }),
      prisma.dailyQuest.count({ where: { userId } }),
      prisma.dailyQuest.count({ where: { userId, status: 'SUCCESS' } }),
      prisma.dailyQuest.count({ where: { userId, status: 'FAILED' } }),
      prisma.dailyQuest.count({ where: { userId, isBoss: true } }),
      prisma.dailyQuest.count({ where: { userId, isBoss: true, status: 'SUCCESS' } }),
      prisma.userEnding.count({ where: { userId } }),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.userInventory.count({ where: { userId } }),
      prisma.userInventory.count({
        where: {
          userId,
          card: { rarity: 5 },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        gold: Number(user.gold),
        level: user.level,
        exp: Number(user.exp),
        currentDay: user.currentDay,
        garageHealth: user.garageHealth,
        techPoints: Number(user.techPoints),
        crewSlots: user.crewSlots,
        totalExplosions: user.totalExplosions,
        totalShopSpent: Number(user.totalShopSpent),
        activePerkCode: user.activePerkCode,
      },
      questStats: {
        totalQuests,
        successQuests,
        failedQuests,
        pendingQuests: totalQuests - successQuests - failedQuests,
        successRate: totalQuests > 0 ? Math.round((successQuests / totalQuests) * 100) : 0,
      },
      bossStats: {
        totalBosses: bossQuests,
        bossWins,
        bossLosses: bossQuests - bossWins,
        bossWinRate: bossQuests > 0 ? Math.round((bossWins / bossQuests) * 100) : 0,
      },
      collection: {
        endingsUnlocked: endingsCount,
        endingsTotal: 9,
        achievementsUnlocked: achievementsCount,
        achievementsTotal: 5,
        uniqueCards: inventoryCount,
        legendaryCards: legendaryCount,
      },
      flags: {
        isFinalRound: user.isFinalRound,
        isInNorthKorea: user.isInNorthKorea,
        hasDefeatedEP: user.hasDefeatedEP,
        hasDefeatedDonaldTrump: user.hasDefeatedDonaldTrump,
        isKimAssassinated: user.isKimAssassinated,
      },
    });

  } catch (error) {
    console.error('Game stats error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
