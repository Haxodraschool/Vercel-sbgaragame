// GET/POST /api/admin/cards — Card management
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');
    const search = searchParams.get('search');

    const where: any = {};
    if (type) where.type = type;
    if (rarity) where.rarity = parseInt(rarity);
    if (search) where.name = { contains: search };

    const cards = await prisma.card.findMany({
      where,
      include: { effects: true },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({ cards, total: cards.length });
  } catch (error) {
    console.error('Admin cards list error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const body = await request.json();
    const { name, type, rarity, statPower, statHeat, statStability, cost, description } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
    }

    const card = await prisma.card.create({
      data: {
        name,
        type,
        rarity: rarity || 1,
        statPower: statPower || 0,
        statHeat: statHeat || 0,
        statStability: statStability || 0,
        cost: cost || 100,
        description: description || '',
      },
    });

    return NextResponse.json({ message: 'Tạo thẻ thành công', card }, { status: 201 });
  } catch (error) {
    console.error('Admin create card error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
