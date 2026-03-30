// POST /api/game/upgrade - Nâng cấp gara (crew slots, tech)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { upgradeType } = await request.json();
    // upgradeType: 'CREW_SLOT'

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    if (upgradeType === 'CREW_SLOT') {
      if (user.crewSlots >= GAME_CONSTANTS.MAX_CREW_SLOTS) {
        return NextResponse.json(
          { error: `Đã đạt tối đa ${GAME_CONSTANTS.MAX_CREW_SLOTS} slot Crew!` },
          { status: 400 }
        );
      }

      const cost = GAME_CONSTANTS.CREW_SLOT_COSTS[user.crewSlots]; // Cost for NEXT slot
      if (Number(user.techPoints) < cost) {
        return NextResponse.json(
          { error: `Không đủ Tech Points! Cần ${cost}, hiện có ${user.techPoints}` },
          { status: 400 }
        );
      }

      const updatedUser = await prisma.user.update({
        where: { id: auth.userId },
        data: {
          crewSlots: { increment: 1 },
          techPoints: { decrement: cost },
        },
      });

      return NextResponse.json({
        message: `Nâng cấp thành công! Crew Slots: ${updatedUser.crewSlots}/${GAME_CONSTANTS.MAX_CREW_SLOTS}`,
        crewSlots: updatedUser.crewSlots,
        techPoints: Number(updatedUser.techPoints),
        nextUpgradeCost: updatedUser.crewSlots < GAME_CONSTANTS.MAX_CREW_SLOTS
          ? GAME_CONSTANTS.CREW_SLOT_COSTS[updatedUser.crewSlots]
          : null,
      });
    }

    return NextResponse.json({ error: 'Loại nâng cấp không hợp lệ' }, { status: 400 });

  } catch (error) {
    console.error('Upgrade error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
