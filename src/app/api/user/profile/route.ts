// GET /api/user/profile - Lấy thông tin người chơi
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
      select: {
        id: true,
        username: true,
        gold: true,
        level: true,
        exp: true,
        currentDay: true,
        garageHealth: true,
        techPoints: true,
        crewSlots: true,
        isFinalRound: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Count stats
    const [totalQuests, successQuests, endingsCount] = await Promise.all([
      prisma.dailyQuest.count({ where: { userId: auth.userId } }),
      prisma.dailyQuest.count({ where: { userId: auth.userId, status: 'SUCCESS' } }),
      prisma.userEnding.count({ where: { userId: auth.userId } }),
    ]);

    return NextResponse.json({
      user: {
        ...user,
        gold: Number(user.gold),
        exp: Number(user.exp),
        techPoints: Number(user.techPoints),
      },
      stats: {
        totalQuests,
        successQuests,
        successRate: totalQuests > 0 ? Math.round((successQuests / totalQuests) * 100) : 0,
        endingsUnlocked: endingsCount,
      },
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
