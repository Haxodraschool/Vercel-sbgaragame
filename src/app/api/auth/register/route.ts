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

    // Tặng thẻ khởi đầu: 45 thẻ 1★-2★ ngẫu nhiên + 5 thẻ 3★
    const starter1Stars = await prisma.card.findMany({ where: { rarity: 1 }, take: 30 });
    const starter2Stars = await prisma.card.findMany({ where: { rarity: 2 }, take: 15 });
    const starter3Stars = await prisma.card.findMany({ where: { rarity: 3 }, take: 5 });

    const allStarterCards = [
      ...starter1Stars.map((c: { id: number }) => ({ userId: user.id, cardId: c.id, quantity: 1 })),
      ...starter2Stars.map((c: { id: number }) => ({ userId: user.id, cardId: c.id, quantity: 1 })),
      ...starter3Stars.map((c: { id: number }) => ({ userId: user.id, cardId: c.id, quantity: 1 })),
    ];

    if (allStarterCards.length > 0) {
      await prisma.userInventory.createMany({
        data: allStarterCards,
        skipDuplicates: true,
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
    return NextResponse.json(
      { error: 'Lỗi server khi đăng ký' },
      { status: 500 }
    );
  }
}
