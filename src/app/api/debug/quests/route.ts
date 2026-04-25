// GET /api/debug/quests - Debug quest generation issues
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
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Get all quests for this user
    const allQuests = await prisma.dailyQuest.findMany({
      where: { userId: auth.userId },
      include: { bossConfig: true },
      orderBy: [{ dayNumber: 'asc' }, { id: 'asc' }],
    });

    // Group by day
    const questsByDay: Record<number, any[]> = {};
    for (const quest of allQuests) {
      if (!questsByDay[quest.dayNumber]) {
        questsByDay[quest.dayNumber] = [];
      }
      questsByDay[quest.dayNumber].push({
        id: quest.id,
        isBoss: quest.isBoss,
        bossName: quest.bossConfig?.name || null,
        requiredPower: quest.requiredPower,
        status: quest.status,
      });
    }

    // Analyze each day
    const analysis: any[] = [];
    for (const [dayNumber, quests] of Object.entries(questsByDay)) {
      const day = parseInt(dayNumber);
      const isBossDay = day % GAME_CONSTANTS.BOSS_INTERVAL === 0;

      let expectedCustomers: number;
      if (day <= GAME_CONSTANTS.FIXED_QUEST_DAYS) {
        // Days 1-5: fixed count
        expectedCustomers = Math.min(day, 4);
      } else {
        // Days 6+: based on level
        expectedCustomers = 6; // Conservative estimate
      }

      const expectedTotal = expectedCustomers + (isBossDay ? 1 : 0);
      const actualTotal = quests.length;
      const bossCount = quests.filter(q => q.isBoss).length;
      const customerCount = quests.filter(q => !q.isBoss).length;

      let issue = null;
      if (day <= GAME_CONSTANTS.FIXED_QUEST_DAYS) {
        const expectedFixed = Math.min(day, 4);
        const expectedTotalFixed = expectedFixed + (isBossDay ? 1 : 0);
        if (actualTotal > expectedTotalFixed) {
          issue = `QUÁ NHIỀU NPC! Ngày ${day} nên có ${expectedFixed} khách${isBossDay ? ' + 1 boss = ' + expectedTotalFixed : ' = ' + expectedFixed}, nhưng thực tế có ${actualTotal} (${customerCount} khách + ${bossCount} boss)`;
        }
      }

      analysis.push({
        day,
        expectedCustomers,
        expectedTotal,
        actualTotal,
        customerCount,
        bossCount,
        isBossDay,
        quests,
        issue,
      });
    }

    return NextResponse.json({
      user: {
        username: user.username,
        currentDay: user.currentDay,
        level: user.level,
      },
      totalQuests: allQuests.length,
      questsByDay,
      analysis,
    });

  } catch (error) {
    console.error('Debug quests error:', error);
    return NextResponse.json({ error: 'Lỗi server', details: String(error) }, { status: 500 });
  }
}
