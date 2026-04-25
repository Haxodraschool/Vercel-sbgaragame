// POST /api/game/end-day - Kết thúc ngày, sang ngày mới
// GET /api/game/end-day - Lấy tổng kết ngày
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Get today's quest summary
    const quests = await prisma.dailyQuest.findMany({
      where: { userId: auth.userId, dayNumber: user.currentDay },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const successQuests = quests.filter((q: any) => q.status === 'SUCCESS');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedQuests = quests.filter((q: any) => q.status === 'FAILED');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalGoldEarned = successQuests.reduce((sum: number, q: any) => sum + q.rewardGold, 0);

    return NextResponse.json({
      daySummary: {
        day: user.currentDay,
        totalCustomers: quests.length,
        success: successQuests.length,
        failed: failedQuests.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pending: quests.filter((q: any) => q.status === 'PENDING').length,
        goldEarned: totalGoldEarned,
        garageHealth: user.garageHealth,
        currentGold: Number(user.gold),
      },
    });

  } catch (error) {
    console.error('End day summary error:', error);
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

    // Mark all remaining PENDING quests as FAILED
    const pendingQuests = await prisma.dailyQuest.findMany({
      where: { userId: auth.userId, dayNumber: user.currentDay, status: 'PENDING' },
    });

    for (const quest of pendingQuests) {
      await prisma.dailyQuest.update({
        where: { id: quest.id },
        data: { status: 'FAILED' },
      });
      // Penalty for skipping
      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          garageHealth: {
            decrement: quest.isBoss
              ? GAME_CONSTANTS.BOSS_FAIL_HEALTH_PENALTY
              : GAME_CONSTANTS.FAIL_HEALTH_PENALTY,
          },
        },
      });
    }

    // Decrement active event turns
    await prisma.userActiveEvent.updateMany({
      where: { userId: auth.userId, remainingTurns: { gt: 0 } },
      data: { remainingTurns: { decrement: 1 } },
    });

    // Remove expired events
    await prisma.userActiveEvent.deleteMany({
      where: { userId: auth.userId, remainingTurns: { lte: 0 } },
    });

    // Add tech points
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        techPoints: { increment: GAME_CONSTANTS.TECH_POINTS_PER_DAY },
      },
    });

    // Check level up
    const updatedUser = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!updatedUser) {
      return NextResponse.json({ error: 'Error' }, { status: 500 });
    }

    const expNeeded = updatedUser.level * 500; // Simple formula
    let leveledUp = false;
    let levelRewardsGiven: any[] = [];
    if (Number(updatedUser.exp) >= expNeeded) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          level: { increment: 1 },
          exp: { decrement: expNeeded },
        },
      });
      leveledUp = true;

      // Gold thưởng khi lên cấp: cấp mới² × 100 → cấp càng cao tiền càng nhiều
      const newLevel = updatedUser.level + 1;
      const levelUpGold = newLevel * newLevel * 100;
      await prisma.user.update({
        where: { id: auth.userId },
        data: { gold: { increment: levelUpGold } },
      });

      // Give level rewards (thẻ bài)
      const rewards = await prisma.levelReward.findMany({
        where: { level: newLevel },
        include: { card: true },
      });

      for (const reward of rewards) {
        await prisma.userInventory.upsert({
          where: { userId_cardId: { userId: auth.userId, cardId: reward.cardId } },
          create: { userId: auth.userId, cardId: reward.cardId, quantity: reward.quantity },
          update: { quantity: { increment: reward.quantity } },
        });
        levelRewardsGiven.push({
          cardName: reward.card.name,
          quantity: reward.quantity,
          cardId: reward.cardId
        });
      }
    }

    // Advance to next day
    const nextDay = user.currentDay + 1;

    // Reset smuggler penalty after it takes effect for this day
    if (user.smugglerPenalty > 0) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { smugglerPenalty: 0 },
      });
    }

    // Check if game should end (Day 50)
    let ending = null;
    if (nextDay > GAME_CONSTANTS.MAX_DAY && !user.isFinalRound) {
      // Check for Absolute Victory (0 fails across all 50 days)
      const totalFails = await prisma.dailyQuest.count({
        where: { userId: auth.userId, status: 'FAILED' },
      });

      if (totalFails === 0) {
        ending = 'The Absolute Victory';
      } else {
        ending = 'Good Ending';
      }

      // Unlock ending
      const endingRecord = await prisma.ending.findFirst({ where: { name: ending } });
      if (endingRecord) {
        await prisma.userEnding.upsert({
          where: { userId_endingId: { userId: auth.userId, endingId: endingRecord.id } },
          create: { userId: auth.userId, endingId: endingRecord.id },
          update: {},
        });
      }
    }

    // Update user day
    if (!ending) {
      await prisma.user.update({
        where: { id: auth.userId },
        data: { 
          currentDay: nextDay,
          ...(user.isInNorthKorea ? { northKoreaDayCount: { increment: 1 } } : {})
        },
      });
    }

    // Refresh user for response
    const finalUser = await prisma.user.findUnique({ where: { id: auth.userId } });

    return NextResponse.json({
      message: ending
        ? `🏆 ${ending}! Bạn đã hoàn thành 50 ngày!`
        : `Ngày ${user.currentDay} kết thúc. Chào mừng Ngày ${nextDay}!`,
      previousDay: user.currentDay,
      nextDay: ending ? null : nextDay,
      ending,
      leveledUp,
      newLevel: leveledUp ? (updatedUser.level + 1) : updatedUser.level,
      levelUpGoldReward: leveledUp ? (updatedUser.level + 1) * (updatedUser.level + 1) * 100 : 0,
      levelRewards: leveledUp ? (levelRewardsGiven || []) : [],
      techPointsEarned: GAME_CONSTANTS.TECH_POINTS_PER_DAY,
      garageHealth: finalUser?.garageHealth,
      gold: finalUser ? Number(finalUser.gold) : 0,
      showFinalRoundChoice: ending === 'Good Ending',
      // Shop tự động mở sau event (Ngày 2+ và chưa ending)
      shopPhase: !ending && (nextDay ?? 0) >= GAME_CONSTANTS.SHOP_UNLOCK_DAY,
    });

  } catch (error) {
    console.error('End day error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
