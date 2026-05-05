// POST /api/shop/reroll — Reroll shop items (giá tăng dần 50 * 2^count)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS, rollRarity } from '@/lib/auth';

// =============================================
// CONSTANTS — Reroll & Shop generation (mirror từ shop/items)
// =============================================
const REROLL_BASE_COST = 50;
const BUNDLE_DISCOUNT = 0.9;
const BUNDLE_CHANCE_RATIO = 1 / 3;
const X2_PACK_CHANCE = 0.005;

const CARD_TYPES_FOR_PRIORITY = [
  'ENGINE', 'TURBO', 'EXHAUST', 'COOLING', 'FILTER',
  'FUEL', 'SUSPENSION', 'TIRE', 'NITROUS', 'TOOL',
];

const PITY_INTERVAL = GAME_CONSTANTS.PITY_INTERVAL;

// =============================================
// Helper: Tính loại thẻ ưu tiên
// =============================================
async function getDeficientTypes(userId: number): Promise<string[]> {
  const inventory = await prisma.userInventory.findMany({
    where: { userId },
    include: { card: { select: { type: true } } },
  });

  const typeCount: Record<string, number> = {};
  for (const t of CARD_TYPES_FOR_PRIORITY) {
    typeCount[t] = 0;
  }
  for (const inv of inventory) {
    const type = (inv as any).card?.type;
    if (type && type !== 'CREW') {
      typeCount[type] = (typeCount[type] || 0) + inv.quantity;
    }
  }

  const sorted = Object.entries(typeCount)
    .sort((a, b) => a[1] - b[1])
    .map(([type]) => type);

  return sorted.slice(0, 3);
}

// =============================================
// Helper: Tính giá Pack theo ngày
// =============================================
function calcPackPrice(currentDay: number, taxModifier: number): number {
  const DAY_START = 2;
  const DAY_MAX = 20;
  const PRICE_START = 350;
  const PRICE_MAX = 1000;
  const dayProgress = Math.min(1, (currentDay - DAY_START) / (DAY_MAX - DAY_START));
  const basePrice = Math.floor(PRICE_START + dayProgress * (PRICE_MAX - PRICE_START));
  return Math.floor(basePrice * taxModifier);
}

// =============================================
// POST /api/shop/reroll
// =============================================
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { rerollCount } = await request.json();
    const count = Math.max(0, Math.floor(rerollCount || 0));

    // Tính giá reroll: 50 * 2^(count/3) - doubles every 3 rerolls
    const rerollCost = REROLL_BASE_COST * Math.pow(2, Math.floor(count / 3));

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    if (user.currentDay < GAME_CONSTANTS.SHOP_UNLOCK_DAY) {
      return NextResponse.json(
        { error: 'Shop chưa mở khóa!', shopUnlocked: false },
        { status: 403 }
      );
    }

    if (Number(user.gold) < rerollCost) {
      return NextResponse.json(
        { error: 'Không đủ vàng để reroll!', required: rerollCost, current: Number(user.gold) },
        { status: 400 }
      );
    }

    // Trừ Gold
    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        gold: { decrement: rerollCost },
        totalShopSpent: { increment: rerollCost },
      },
    });

    // Tax modifier
    let activeTaxModifier = 1.0;
    if (user.currentDay <= user.shopTaxExpiresAt) {
      activeTaxModifier = user.shopTaxModifier;
    }
    if (user.activePerkCode === 'VIP_CARD' && user.currentDay <= 10) {
      activeTaxModifier *= 0.8;
    }

    // Loại thẻ ưu tiên
    const deficientTypes = await getDeficientTypes(auth.userId);

    // ============================================================
    // GENERATE 6 SLOTS (logic giống GET /api/shop/items)
    // ============================================================
    const shopItems = [];

    for (let i = 0; i < GAME_CONSTANTS.SHOP_ITEMS_COUNT; i++) {
      const roll = Math.random();

      if (roll < X2_PACK_CHANCE) {
        const packPrice = calcPackPrice(user.currentDay, activeTaxModifier);
        shopItems.push({
          slotIndex: i,
          type: 'X2_PACK' as const,
          name: '🎁 Gói Thẻ x2 (Deal Hiếm!)',
          description: `Mua 1 giá Pack, nhận ${GAME_CONSTANTS.PACK_CARDS_COUNT * 2} thẻ! Cực hiếm 0.5%!`,
          cost: packPrice,
          rarity: null,
          card: null,
          bundleQuantity: null,
        });
        continue;
      }

      if (roll < X2_PACK_CHANCE + GAME_CONSTANTS.PACK_CHANCE_IN_SHOP) {
        const packPrice = calcPackPrice(user.currentDay, activeTaxModifier);
        shopItems.push({
          slotIndex: i,
          type: 'PACK' as const,
          name: 'Gói Thẻ Bí Ẩn',
          description: `Mở ra nhận ${GAME_CONSTANTS.PACK_CARDS_COUNT} thẻ ngẫu nhiên!`,
          cost: packPrice,
          rarity: null,
          card: null,
          bundleQuantity: null,
        });
        continue;
      }

      const rarity = rollRarity();

      let isBundle = false;
      let bundleQuantity = 1;

      if (rarity === 1) {
        const bundleChance = GAME_CONSTANTS.DROP_RATES[1] * BUNDLE_CHANCE_RATIO;
        if (Math.random() < bundleChance) {
          isBundle = true;
          bundleQuantity = 3;
        }
      } else if (rarity === 2) {
        const bundleChance = GAME_CONSTANTS.DROP_RATES[2] * BUNDLE_CHANCE_RATIO;
        if (Math.random() < bundleChance) {
          isBundle = true;
          bundleQuantity = 2;
        }
      }

      let typeFilter: any = { not: 'CREW' };
      if (Math.random() < 0.5 && deficientTypes.length > 0) {
        const priorityType = deficientTypes[Math.floor(Math.random() * deficientTypes.length)];
        typeFilter = priorityType;
      }

      const cards = await prisma.card.findMany({
        where: { rarity, type: typeFilter },
        include: { effects: true },
      });

      let cardPool = cards;
      if (cardPool.length === 0) {
        cardPool = await prisma.card.findMany({
          where: { rarity, type: { not: 'CREW' } },
          include: { effects: true },
        });
      }

      if (cardPool.length > 0) {
        const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
        const singlePrice = Math.floor(randomCard.cost * activeTaxModifier);
        const totalCost = isBundle
          ? Math.floor(singlePrice * bundleQuantity * BUNDLE_DISCOUNT)
          : singlePrice;

        shopItems.push({
          slotIndex: i,
          type: isBundle ? ('BUNDLE' as const) : ('CARD' as const),
          name: isBundle
            ? `📦 Cụm ${bundleQuantity}x ${randomCard.name}`
            : randomCard.name,
          description: isBundle
            ? `${bundleQuantity} thẻ giống nhau, giảm 10%! ${randomCard.description}`
            : randomCard.description,
          cost: totalCost,
          rarity: randomCard.rarity,
          card: {
            id: randomCard.id,
            name: randomCard.name,
            type: randomCard.type,
            rarity: randomCard.rarity,
            statPower: randomCard.statPower,
            statHeat: randomCard.statHeat,
            statStability: randomCard.statStability,
            imageUrl: randomCard.imageUrl,
            effects: randomCard.effects,
          },
          bundleQuantity: isBundle ? bundleQuantity : null,
        });
      }
    }

    // CREW SLOT
    const ownedCrewIds = (await prisma.userInventory.findMany({
      where: { userId: auth.userId },
      include: { card: true },
    })).filter((inv: any) => inv.card?.type === 'CREW').map((inv: any) => inv.cardId);

    const unownedCrew = await prisma.card.findMany({
      where: {
        type: 'CREW',
        unlockType: 'SHOP',
        id: { notIn: ownedCrewIds },
      },
      include: { effects: true },
    });

    let crewSlot: any = null;
    if (unownedCrew.length > 0) {
      const randomCrew = unownedCrew[Math.floor(Math.random() * unownedCrew.length)];
      crewSlot = {
        slotIndex: 'crew',
        type: 'CREW' as const,
        name: randomCrew.name,
        description: randomCrew.description,
        cost: Math.floor(randomCrew.cost * activeTaxModifier),
        rarity: randomCrew.rarity,
        card: {
          id: randomCrew.id,
          name: randomCrew.name,
          type: randomCrew.type,
          rarity: randomCrew.rarity,
          statPower: randomCrew.statPower,
          statHeat: randomCrew.statHeat,
          statStability: randomCrew.statStability,
          imageUrl: randomCrew.imageUrl,
          effects: randomCrew.effects,
        },
      };
    }

    const newGold = Number(user.gold) - rerollCost;
    const nextRerollCost = REROLL_BASE_COST * Math.pow(2, Math.floor((count + 1) / 3));

    return NextResponse.json({
      shopUnlocked: true,
      gold: newGold,
      items: shopItems,
      crewSlot,
      pityCounter: user.totalPacksOpened % PITY_INTERVAL,
      nextPityAt: PITY_INTERVAL - (user.totalPacksOpened % PITY_INTERVAL),
      rerollCost,
      nextRerollCost,
    });

  } catch (error) {
    console.error('Shop reroll error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
