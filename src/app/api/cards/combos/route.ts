// GET /api/cards/combos - Danh sách tất cả combo phản ứng dây chuyền
// GET /api/cards/combos?cardId=5 - Lọc combo theo card ID
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (cardId) {
      const id = parseInt(cardId);
      where.OR = [{ cardId1: id }, { cardId2: id }];
    }

    const combos = await prisma.cardCombo.findMany({
      where,
      include: {
        card1: { select: { id: true, name: true, type: true, rarity: true } },
        card2: { select: { id: true, name: true, type: true, rarity: true } },
      },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      combos: combos.map((c: any) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        effectType: c.effectType,
        effectValue: c.effectValue,
        card1: c.card1,
        card2: c.card2,
      })),
      total: combos.length,
    });

  } catch (error) {
    console.error('Combos list error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
