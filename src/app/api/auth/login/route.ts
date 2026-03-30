// POST /api/auth/login - Đăng nhập
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username và password là bắt buộc' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Sai username hoặc password' },
        { status: 401 }
      );
    }

    const token = createToken({ userId: user.id, username: user.username });

    return NextResponse.json({
      message: 'Đăng nhập thành công! Cửa gara đang mở...',
      token,
      user: {
        id: user.id,
        username: user.username,
        gold: Number(user.gold),
        level: user.level,
        exp: Number(user.exp),
        currentDay: user.currentDay,
        garageHealth: user.garageHealth,
        techPoints: Number(user.techPoints),
        crewSlots: user.crewSlots,
        isFinalRound: user.isFinalRound,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi đăng nhập' },
      { status: 500 }
    );
  }
}
