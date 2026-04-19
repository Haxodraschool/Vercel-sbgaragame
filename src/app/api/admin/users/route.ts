// GET /api/admin/users — List all users (with pagination & search)
// POST /api/admin/users — Create new user
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse, serializeUser } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (search) {
      where.username = { contains: search };
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          username: true,
          role: true,
          gold: true,
          level: true,
          exp: true,
          currentDay: true,
          garageHealth: true,
          techPoints: true,
          crewSlots: true,
          isFinalRound: true,
          totalShopSpent: true,
          totalPacksOpened: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        gold: Number(u.gold),
        exp: Number(u.exp),
        techPoints: Number(u.techPoints),
        totalShopSpent: Number(u.totalShopSpent),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username và password là bắt buộc' }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username đã tồn tại' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'PLAYER',
      },
    });

    return NextResponse.json({
      message: 'Tạo tài khoản thành công',
      user: serializeUser(user),
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
