// GET /api/quest/daily - Lấy quest hôm nay
// POST /api/quest/daily - Generate quest cho ngày mới
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS, randomInt } from '@/lib/auth';

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

    const quests = await prisma.dailyQuest.findMany({
      where: {
        userId: auth.userId,
        dayNumber: user.currentDay,
      },
      include: {
        bossConfig: true,
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      currentDay: user.currentDay,
      garageHealth: user.garageHealth,
      gold: Number(user.gold),
      quests: quests.map((q: any) => ({
        id: q.id,
        dayNumber: q.dayNumber,
        isBoss: q.isBoss,
        bossConfig: q.bossConfig ? {
          name: q.bossConfig.name,
          description: q.bossConfig.description,
          specialCondition: q.bossConfig.specialCondition,
          imageUrl: q.bossConfig.imageUrl,
        } : null,
        requiredPower: q.requiredPower,
        rewardGold: q.rewardGold,
        customerBudget: q.customerBudget || 0,
        status: q.status,
      })),
      totalShadows: quests.length,
      completed: quests.filter((q: any) => q.status !== 'PENDING').length,
      pending: quests.filter((q: any) => q.status === 'PENDING').length,
    });

  } catch (error) {
    console.error('Daily quest error:', error);
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

    // Check if quests already generated for current day
    const existingQuests = await prisma.dailyQuest.count({
      where: { userId: auth.userId, dayNumber: user.currentDay },
    });
    if (existingQuests > 0) {
      return NextResponse.json(
        { error: 'Quest ngày hôm nay đã được tạo rồi!' },
        { status: 400 }
      );
    }

    // Determine number of customers
    let customerCount: number;
    const isBossDay = user.currentDay % GAME_CONSTANTS.BOSS_INTERVAL === 0;

    if (user.currentDay <= GAME_CONSTANTS.FIXED_QUEST_DAYS) {
      // Ngày 1-5: số lượng khách tăng dần
      customerCount = Math.min(user.currentDay + 2, 8);
    } else {
      // Ngày 6+: Random
      const config = await prisma.questConfig.findFirst({
        where: {
          minLevel: { lte: user.level },
          maxLevel: { gte: user.level },
        },
      });
      customerCount = config
        ? randomInt(config.minCustomers, Math.max(config.maxCustomers, 8))
        : randomInt(4, 8);
    }

    // Get quest config for power/gold range
    let questConfig = await prisma.questConfig.findFirst({
      where: {
        minLevel: { lte: user.level },
        maxLevel: { gte: user.level },
      },
    });

    // Fallback if no exact match found (e.g. user level > 99 or DB not seeded)
    if (!questConfig) {
      questConfig = await prisma.questConfig.findFirst({
        orderBy: { maxLevel: 'desc' }
      });
    }

    const questsData = [];

    // Determine fixed requirements for North Korea customers
    const nkReqPower = randomInt(150, 300);
    const nkRewGold = randomInt(50, 150);

    // Generate normal customer quests
    for (let i = 0; i < customerCount; i++) {
      const baseGold = user.isInNorthKorea
        ? nkRewGold
        : (questConfig
          ? randomInt(questConfig.minGoldReward, questConfig.maxGoldReward)
          : randomInt(50, 200));

      // Ngân sách khách = 2x – 4x tiền thưởng
      const budgetMultiplier = 2.0 + Math.random() * 2.0; // 2.0 – 4.0
      const customerBudget = Math.floor(baseGold * budgetMultiplier);

      questsData.push({
        userId: auth.userId,
        dayNumber: user.currentDay,
        isBoss: false,
        requiredPower: user.isInNorthKorea
          ? nkReqPower
          : (questConfig
            ? randomInt(questConfig.minPowerReq, questConfig.maxPowerReq)
            : randomInt(100, 300)),
        rewardGold: baseGold,
        customerBudget,
        status: 'PENDING' as const,
      });
    }

    // Add boss if boss day
    if (isBossDay) {
      let bosses = await prisma.bossConfig.findMany();
      if (!user.hasDefeatedEP) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bosses = bosses.filter((b: any) => b.specialCondition !== 'DONALD_TRUMP');
      }
      if (user.isKimAssassinated) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bosses = bosses.filter((b: any) => b.specialCondition !== 'KIM_JONG_UN');
      }
      // Kẻ Bí Ẩn chỉ xuất hiện sau ngày 10
      if (user.currentDay <= 10) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        bosses = bosses.filter((b: any) => b.name !== 'Kẻ Bí Ẩn');
      }
      if (bosses.length > 0) {
        // Tăng tỉ lệ xuất hiện của Chủ Tịch Kim 20%
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bossPool: any[] = [];
        for (const b of bosses) {
          bossPool.push(b);
          if (b.specialCondition === 'KIM_JONG_UN') {
            const extraTickets = Math.max(1, Math.ceil(bosses.length * 0.2));
            for (let k = 0; k < extraTickets; k++) bossPool.push(b);
          }
          // Tăng tỉ lệ Nga Đại Đế 20% nếu Kim bị ám sát hoặc đã thắng Đỗ Nam Trung
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (b.specialCondition === 'RUSSIA_EMPEROR' && ((user as any).isKimAssassinated || (user as any).hasDefeatedDonaldTrump)) {
            const extraTickets = Math.max(1, Math.ceil(bosses.length * 0.2));
            for (let k = 0; k < extraTickets; k++) bossPool.push(b);
          }
        }
        
        const randomBoss = bossPool[Math.floor(Math.random() * bossPool.length)];
        questsData.push({
          userId: auth.userId,
          dayNumber: user.currentDay,
          isBoss: true,
          bossConfigId: randomBoss.id,
          requiredPower: randomBoss.requiredPower,
          rewardGold: randomBoss.rewardGold,
          status: 'PENDING' as const,
        });
      }
    }

    await prisma.dailyQuest.createMany({ data: questsData });

    return NextResponse.json({
      message: `Ngày ${user.currentDay} bắt đầu! ${customerCount} khách hàng${isBossDay ? ' + 1 BOSS' : ''} đã đến.`,
      currentDay: user.currentDay,
      totalShadows: questsData.length,
      isBossDay,
    });

  } catch (error) {
    console.error('Generate quest error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
