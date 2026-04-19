// GET/PATCH /api/admin/config — Game constants management
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

// In-memory overrides for game constants (persisted as JSON in a simple approach)
// In production, you'd store these in a DB table
let configOverrides: Record<string, any> = {};

export async function GET(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const [bosses, events, questConfigs] = await Promise.all([
      prisma.bossConfig.findMany({ orderBy: { id: 'asc' } }),
      prisma.gameEvent.findMany({ orderBy: { id: 'asc' } }),
      prisma.questConfig.findMany({ orderBy: { id: 'asc' } }),
    ]);

    // Import default constants
    const { GAME_CONSTANTS } = await import('@/lib/auth');

    return NextResponse.json({
      gameConstants: { ...GAME_CONSTANTS, ...configOverrides },
      bosses,
      events,
      questConfigs,
      overrides: configOverrides,
    });
  } catch (error) {
    console.error('Admin config error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { type, id, data } = await request.json();

    switch (type) {
      case 'boss': {
        const boss = await prisma.bossConfig.update({
          where: { id },
          data,
        });
        return NextResponse.json({ message: 'Cập nhật Boss thành công', boss });
      }

      case 'event': {
        const event = await prisma.gameEvent.update({
          where: { id },
          data,
        });
        return NextResponse.json({ message: 'Cập nhật Event thành công', event });
      }

      case 'questConfig': {
        const qc = await prisma.questConfig.update({
          where: { id },
          data,
        });
        return NextResponse.json({ message: 'Cập nhật Quest Config thành công', questConfig: qc });
      }

      case 'constants': {
        // Save overrides in memory
        configOverrides = { ...configOverrides, ...data };
        return NextResponse.json({ message: 'Cập nhật constants thành công (runtime)', overrides: configOverrides });
      }

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin config update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
