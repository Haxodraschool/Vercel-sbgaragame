// POST /api/debug/fix-quests - Fix quest generation issues by removing excess NPCs
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
      questsByDay[quest.dayNumber].push(quest);
    }

    let totalFixed = 0;
    const fixReport: any[] = [];

    for (const [dayNumber, quests] of Object.entries(questsByDay)) {
      const day = parseInt(dayNumber);
      const isBossDay = day % GAME_CONSTANTS.BOSS_INTERVAL === 0;

      let expectedCustomers: number;
      if (day <= GAME_CONSTANTS.FIXED_QUEST_DAYS) {
        // Days 1-5: fixed count
        expectedCustomers = Math.min(day, 4);
      } else {
        // Days 6+: based on level, but we'll use a reasonable max
        expectedCustomers = 6; // Conservative limit
      }

      const expectedTotal = expectedCustomers + (isBossDay ? 1 : 0);
      const actualTotal = quests.length;

      if (actualTotal > expectedTotal) {
        // Too many quests - remove excess
        const excessCount = actualTotal - expectedTotal;
        
        // Keep bosses first, then remove excess non-boss quests
        const bosses = quests.filter(q => q.isBoss);
        const nonBosses = quests.filter(q => !q.isBoss);
        
        const excessNonBosses = nonBosses.slice(excessCount);
        const excessIds = excessNonBosses.map(q => q.id);

        // Delete excess quests (only PENDING status to avoid affecting completed quests)
        const deletableIds = excessIds.filter(id => {
          const quest = quests.find(q => q.id === id);
          return quest && quest.status === 'PENDING';
        });

        if (deletableIds.length > 0) {
          await prisma.dailyQuest.deleteMany({
            where: {
              id: { in: deletableIds },
              status: 'PENDING',
            },
          });

          totalFixed += deletableIds.length;
          fixReport.push({
            day,
            before: actualTotal,
            after: expectedTotal,
            removed: deletableIds.length,
            reason: `Exceeded expected ${expectedTotal} (had ${actualTotal})`,
          });
        }
      }
    }

    console.log(`[Quest Fix] Fixed ${totalFixed} excess quests for user ${user.username}`);

    return NextResponse.json({
      message: `Đã sửa ${totalFixed} quest thừa`,
      totalFixed,
      fixReport,
    });

  } catch (error) {
    console.error('Fix quests error:', error);
    return NextResponse.json({ error: 'Lỗi server', details: String(error) }, { status: 500 });
  }
}
