// GET /api/dev/fix-budget - Fix quest cũ không có customerBudget
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Find all PENDING non-boss quests that have no customerBudget
    const questsToFix = await prisma.dailyQuest.findMany({
      where: {
        isBoss: false,
        status: 'PENDING',
        OR: [
          { customerBudget: 0 },
          { customerBudget: null as any },
        ],
      },
    });

    // Update each quest individually
    let fixedCount = 0;
    for (const quest of questsToFix) {
      await prisma.dailyQuest.update({
        where: { id: quest.id },
        data: {
          // Set customerBudget = rewardGold * 3 (middle of 2-4x range)
          customerBudget: quest.rewardGold * 3,
        },
      });
      fixedCount++;
    }

    // Get updated quests to show
    const updatedQuests = await prisma.dailyQuest.findMany({
      where: {
        isBoss: false,
        status: 'PENDING',
        customerBudget: { gt: 0 },
      },
      select: {
        id: true,
        dayNumber: true,
        requiredPower: true,
        rewardGold: true,
        customerBudget: true,
        userId: true,
      },
      take: 10,
    });

    return NextResponse.json({
      message: `Fixed ${fixedCount} quests`,
      updatedCount: fixedCount,
      sampleQuests: updatedQuests,
    });
  } catch (error) {
    console.error('Fix budget error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
