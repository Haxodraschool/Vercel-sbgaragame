// GET /api/game/leaderboard - Bảng xếp hạng top người chơi
// GET /api/game/leaderboard?sort=gold&limit=20
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'level';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any = { level: 'desc' };
    if (sort === 'gold') orderBy = { gold: 'desc' };
    else if (sort === 'day') orderBy = { currentDay: 'desc' };
    else if (sort === 'health') orderBy = { garageHealth: 'desc' };

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        gold: true,
        level: true,
        currentDay: true,
        garageHealth: true,
        isFinalRound: true,
        _count: {
          select: {
            endings: true,
            achievements: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    return NextResponse.json({
      leaderboard: users.map((u, index) => ({
        rank: index + 1,
        id: u.id,
        username: u.username,
        gold: Number(u.gold),
        level: u.level,
        currentDay: u.currentDay,
        garageHealth: u.garageHealth,
        isFinalRound: u.isFinalRound,
        endingsUnlocked: u._count.endings,
        achievementsUnlocked: u._count.achievements,
      })),
      sortBy: sort,
      total: users.length,
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
