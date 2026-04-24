import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      // Update existing user to admin
      await prisma.user.update({
        where: { username },
        data: { role: 'ADMIN' },
      });
      return NextResponse.json({
        message: 'Đã cập nhật role thành ADMIN cho user hiện có',
        username,
        role: 'ADMIN',
      });
    }

    // Create new admin user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN',
        gold: 0,
        level: 1,
        exp: 0,
        currentDay: 1,
        garageHealth: 100,
        techPoints: 0,
        crewSlots: 1,
        isFinalRound: false,
      },
    });

    return NextResponse.json({
      message: 'Đã tạo admin account thành công',
      username,
      role: 'ADMIN',
      id: user.id,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Lỗi server khi tạo admin' },
      { status: 500 }
    );
  }
}
