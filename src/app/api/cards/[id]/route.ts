// GET /api/cards/[id] - Chi tiết thẻ bài
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cardId = parseInt(id);

    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        effects: true,
        combosAs1: {
          include: { card2: { select: { id: true, name: true, type: true, rarity: true } } },
        },
        combosAs2: {
          include: { card1: { select: { id: true, name: true, type: true, rarity: true } } },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Không tìm thấy thẻ bài' }, { status: 404 });
    }

    return NextResponse.json({
      card: {
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
          ...card.combosAs1.map((c) => ({
            partnerId: c.card2.id,
            partnerName: c.card2.name,
            partnerType: c.card2.type,
            partnerRarity: c.card2.rarity,
            effectType: c.effectType,
            effectValue: c.effectValue,
          })),
          ...card.combosAs2.map((c) => ({
            partnerId: c.card1.id,
            partnerName: c.card1.name,
            partnerType: c.card1.type,
            partnerRarity: c.card1.rarity,
            effectType: c.effectType,
            effectValue: c.effectValue,
          })),
        ],
      },
    });

  } catch (error) {
    console.error('Card detail error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
