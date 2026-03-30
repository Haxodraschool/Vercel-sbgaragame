// GET /api/user/inventory - Lấy kho thẻ bài của người chơi
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');

    // Build filter
    const cardFilter: Record<string, unknown> = {};
    if (type) cardFilter.type = type;
    if (rarity) cardFilter.rarity = parseInt(rarity);

    const inventory = await prisma.userInventory.findMany({
      where: {
        userId: auth.userId,
        card: Object.keys(cardFilter).length > 0 ? cardFilter : undefined,
      },
      include: {
        card: {
          include: {
            effects: true,
          },
        },
      },
      orderBy: [
        { card: { rarity: 'desc' } },
        { card: { type: 'asc' } },
      ],
    });

    return NextResponse.json({
      inventory: inventory.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        card: {
          id: item.card.id,
          name: item.card.name,
          type: item.card.type,
          rarity: item.card.rarity,
          statPower: item.card.statPower,
          statHeat: item.card.statHeat,
          statStability: item.card.statStability,
          imageUrl: item.card.imageUrl,
          description: item.card.description,
          effects: item.card.effects,
        },
      })),
      totalCards: inventory.reduce((sum, item) => sum + item.quantity, 0),
      uniqueCards: inventory.length,
    });

  } catch (error) {
    console.error('Inventory error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
