// POST /api/achievements/secret - Easter egg unlock (Hacker Mũ Đen)
// Frontend gửi POST khi user click đồng hồ 13 lần lúc nửa đêm
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { secretCode, clickCount } = await request.json();

    if (secretCode !== 'MIDNIGHT_CLOCK' || clickCount < 13) {
      return NextResponse.json({ error: 'Không có gì xảy ra...' }, { status: 400 });
    }

    // Verify it's around midnight (11PM - 1AM server time)
    const now = new Date();
    const hour = now.getHours();
    if (hour > 1 && hour < 23) {
      return NextResponse.json({
        message: '⏰ Đồng hồ nhấp nháy... nhưng chưa đúng thời điểm.',
        hint: 'Hãy thử lại vào lúc nửa đêm...',
      });
    }

    // Check if already unlocked
    const achievement = await prisma.achievement.findUnique({
      where: { code: 'MIDNIGHT_HACKER' },
    });

    if (!achievement) {
      return NextResponse.json({ error: 'Achievement chưa được cấu hình' }, { status: 500 });
    }

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId: auth.userId, achievementId: achievement.id } },
    });

    if (existing) {
      return NextResponse.json({
        message: '💻 Hacker Mũ Đen đã ở trong đội của bạn rồi!',
        alreadyUnlocked: true,
      });
    }

    // Unlock!
    await prisma.userAchievement.create({
      data: { userId: auth.userId, achievementId: achievement.id },
    });

    // Grant Black-Hat crew card
    if (achievement.rewardCrewId) {
      await prisma.userInventory.upsert({
        where: { userId_cardId: { userId: auth.userId, cardId: achievement.rewardCrewId } },
        create: { userId: auth.userId, cardId: achievement.rewardCrewId, quantity: 1 },
        update: {},
      });
    }

    return NextResponse.json({
      message: '🎩💻 MỞ KHÓA: Hacker Mũ Đen (Black-Hat)! "Chỉnh sửa mã nguồn" - Đổi vị trí 2 thẻ khi đang test!',
      achievement: {
        code: achievement.code,
        name: achievement.name,
      },
      unlocked: true,
    });

  } catch (error) {
    console.error('Secret achievement error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
