// GET /api/game/endings - Danh sách endings đã đạt của người chơi
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Get all endings
    const allEndings = await prisma.ending.findMany({
      orderBy: { id: 'asc' },
    });

    // Get user's achieved endings
    const userEndings = await prisma.userEnding.findMany({
      where: { userId: auth.userId },
      include: { ending: true },
    });

    const achievedIds = new Set(userEndings.map(ue => ue.endingId));

    return NextResponse.json({
      endings: allEndings.map(ending => ({
        id: ending.id,
        name: achievedIds.has(ending.id) ? ending.name : '???',
        type: ending.type,
        description: achievedIds.has(ending.id) ? ending.description : 'Chưa mở khóa...',
        isUnlocked: achievedIds.has(ending.id),
        achievedAt: userEndings.find(ue => ue.endingId === ending.id)?.achievedAt ?? null,
      })),
      totalEndings: allEndings.length,
      unlockedCount: userEndings.length,
    });

  } catch (error) {
    console.error('Endings error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
