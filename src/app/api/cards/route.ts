// GET /api/cards - Danh sách thẻ bài (có filter)
// GET /api/cards?type=ENGINE&rarity=3
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const rarity = searchParams.get('rarity');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (type) where.type = type;
    if (rarity) where.rarity = parseInt(rarity);

    const cards = await prisma.card.findMany({
      where,
      include: {
        effects: true,
        combosAs1: { include: { card2: { select: { id: true, name: true } } } },
        combosAs2: { include: { card1: { select: { id: true, name: true } } } },
      },
      orderBy: [{ rarity: 'desc' }, { type: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cards: cards.map((card: any) => ({
        id: card.id,
        name: card.name,
        type: card.type,
        rarity: card.rarity,
        statPower: card.statPower,
        statHeat: card.statHeat,
        statStability: card.statStability,
        imageUrl: card.imageUrl,
        description: card.description,
        cost: card.cost,
        effects: card.effects,
        combos: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...card.combosAs1.map((c: any) => ({
            partnerId: c.card2.id,
            partnerName: c.card2.name,
            effectType: c.effectType,
            effectValue: c.effectValue,
          })),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...card.combosAs2.map((c: any) => ({
            partnerId: c.card1.id,
            partnerName: c.card1.name,
            effectType: c.effectType,
            effectValue: c.effectValue,
          })),
        ],
      })),
      total: cards.length,
    });

  } catch (error) {
    console.error('Cards list error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
