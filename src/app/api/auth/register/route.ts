// POST /api/auth/register - Đăng ký tài khoản mới
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username và password là bắt buộc' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 50) {
      return NextResponse.json(
        { error: 'Username phải từ 3-50 ký tự' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password phải ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username đã tồn tại' },
        { status: 409 }
      );
    }

    // Create user with default values + STARTUP_FUND perk (+200 Gold)
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        gold: 1700, // 1500 base + 200 từ STARTUP_FUND
        level: 1,
        exp: 0,
        currentDay: 1,
        garageHealth: 100,
        techPoints: 0,
        crewSlots: 1,
        isFinalRound: false,
        activePerkCode: 'STARTUP_FUND', // Đặc quyền mặc định
      },
    });

    // Tặng thẻ khởi đầu: 80 thẻ = 10 nhóm loại thẻ × 8 thẻ ngẫu nhiên 1-3★ (độc nhất) mỗi nhóm
    const cardTypes = ['ENGINE', 'TURBO', 'EXHAUST', 'COOLING', 'FILTER', 'FUEL', 'SUSPENSION', 'TIRE', 'NITROUS', 'TOOL'];
    const quantityByCardId = new Map<number, number>();

    for (const type of cardTypes) {
      const availableCards = await prisma.card.findMany({
        where: { type: type as any, rarity: { in: [1, 2, 3] } },
        select: { id: true },
      });
      if (availableCards.length === 0) continue;

      // Pick 8 unique random cards
      const shuffled = availableCards.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 8);
      for (const card of selected) {
        quantityByCardId.set(card.id, (quantityByCardId.get(card.id) || 0) + 1);
      }
    }

    if (quantityByCardId.size > 0) {
      await prisma.userInventory.createMany({
        data: Array.from(quantityByCardId.entries()).map(([cardId, quantity]) => ({
          userId: user.id,
          cardId,
          quantity,
        })),
      });
    }

    const token = createToken({ userId: user.id, username: user.username });

    return NextResponse.json({
      message: 'Đăng ký thành công! Chào mừng đến SB-GARAGE!',
      token,
      user: {
        id: user.id,
        username: user.username,
        gold: Number(user.gold),
        level: user.level,
        currentDay: user.currentDay,
        garageHealth: user.garageHealth,
        crewSlots: user.crewSlots,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.error('DATABASE_URL prefix:', process.env.DATABASE_URL?.substring(0, 20));
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Lỗi server khi đăng ký', details: errorMessage },
      { status: 500 }
    );
  }
}
