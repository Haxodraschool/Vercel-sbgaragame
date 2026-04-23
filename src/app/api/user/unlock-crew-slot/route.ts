// POST /api/user/unlock-crew-slot - Mở khóa slot crew bằng TechPoints
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// Cost per slot: 100, 200, 300, 400 (slots 2, 3, 4, 5)
const SLOT_COSTS = [0, 100, 200, 300, 400]; // Index 0 = slot 1 (free), Index 1 = slot 2, etc.
const MAX_CREW_SLOTS = 5;

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

    const currentSlots = user.crewSlots;
    if (currentSlots >= MAX_CREW_SLOTS) {
      return NextResponse.json({ error: 'Đã mở khóa tối đa 5 slot crew!' }, { status: 400 });
    }

    const nextSlotIndex = currentSlots; // 0-indexed: if crewSlots=1, next is index 1 (slot 2)
    const cost = SLOT_COSTS[nextSlotIndex];
    const currentTechPoints = Number(user.techPoints);

    if (currentTechPoints < cost) {
      return NextResponse.json({ 
        error: `Không đủ TechPoints! Cần ${cost} TP, bạn có ${currentTechPoints} TP.` 
      }, { status: 400 });
    }

    // Deduct TechPoints and unlock slot
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        techPoints: { decrement: cost },
        crewSlots: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: `Đã mở khóa Slot Crew ${currentSlots + 1}!`,
      crewSlots: updatedUser.crewSlots,
      techPoints: Number(updatedUser.techPoints),
      cost,
    });

  } catch (error) {
    console.error('Unlock crew slot error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// GET - Lấy thông tin giá mở khóa slot tiếp theo
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

    const currentSlots = user.crewSlots;
    const nextSlotIndex = currentSlots;
    const nextCost = currentSlots >= MAX_CREW_SLOTS ? null : SLOT_COSTS[nextSlotIndex];

    return NextResponse.json({
      currentSlots,
      maxSlots: MAX_CREW_SLOTS,
      nextCost,
      techPoints: Number(user.techPoints),
      canUnlock: nextCost !== null && Number(user.techPoints) >= nextCost,
    });

  } catch (error) {
    console.error('Get crew slot info error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
