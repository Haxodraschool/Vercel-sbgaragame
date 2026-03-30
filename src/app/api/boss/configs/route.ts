// GET /api/boss/configs - Danh sách tất cả Boss
// GET /api/boss/configs?id=1 - Chi tiết 1 Boss
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const boss = await prisma.bossConfig.findUnique({
        where: { id: parseInt(id) },
      });
      if (!boss) {
        return NextResponse.json({ error: 'Boss không tồn tại' }, { status: 404 });
      }
      return NextResponse.json({ boss });
    }

    const bosses = await prisma.bossConfig.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      bosses,
      total: bosses.length,
    });

  } catch (error) {
    console.error('Boss configs error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
