// GET /api/shop/items - Hiển thị shop (ưu tiên loại thiếu + cụm thẻ + x2 Pack)
// POST /api/shop/buy - Mua thẻ, cụm thẻ, pack, hoặc x2 pack
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS, rollRarity } from '@/lib/auth';

// =============================================
// CONSTANTS cho cơ chế Shop mới
// =============================================
const BUNDLE_DISCOUNT = 0.9; // Giảm 10% tổng giá cụm
const BUNDLE_CHANCE_RATIO = 1 / 3; // Tỉ lệ cụm = 1/3 drop rate gốc
const X2_PACK_CHANCE = 0.005; // 0.5% chance x2 Pack
const PITY_INTERVAL = 10; // Pack thứ 8 đảm bảo 4-5★

const CARD_TYPES_FOR_PRIORITY = [
  'ENGINE', 'TURBO', 'EXHAUST', 'COOLING', 'FILTER',
  'FUEL', 'SUSPENSION', 'TIRE', 'NITROUS', 'TOOL',
];

// =============================================
// Helper: Tính loại thẻ ưu tiên (player sở hữu ít nhất)
// =============================================
async function getDeficientTypes(userId: number): Promise<string[]> {
  // Đếm số thẻ theo từng loại trong inventory
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

  // Sort ascending → loại ít nhất lên đầu, trả top 3
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
// GET /api/shop/items
// =============================================
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user || user.currentDay < GAME_CONSTANTS.SHOP_UNLOCK_DAY) {
      return NextResponse.json(
        { error: 'Shop chưa mở khóa! Shop mở từ Ngày 2.', shopUnlocked: false },
        { status: 403 }
      );
    }

    // Tax modifier (Đỗ Nam Trung + VIP perk)
    let activeTaxModifier = 1.0;
    if (user.currentDay <= user.shopTaxExpiresAt) {
      activeTaxModifier = user.shopTaxModifier;
    }
    if (user.activePerkCode === 'VIP_CARD' && user.currentDay <= 10) {
      activeTaxModifier *= 0.8;
    }

    // Loại thẻ ưu tiên (top 3 loại player sở hữu ít nhất)
    const deficientTypes = await getDeficientTypes(auth.userId);

    // ============================================================
    // GENERATE 6 SLOTS: CARD / BUNDLE / PACK / X2_PACK
    // ============================================================
    const shopItems = [];

    for (let i = 0; i < GAME_CONSTANTS.SHOP_ITEMS_COUNT; i++) {
      const roll = Math.random();

      // --- 0.5% chance: x2 Pack Deal ---
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

      // --- 10% chance: Pack thường ---
      if (roll < X2_PACK_CHANCE + 0.1) {
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

      // --- Còn lại: CARD hoặc BUNDLE ---
      const rarity = rollRarity();

      // Check bundle chance cho 1★ và 2★
      let isBundle = false;
      let bundleQuantity = 1;

      if (rarity === 1) {
        // 1★: bundle chance = 1/3 × 60% = 20%
        const bundleChance = GAME_CONSTANTS.DROP_RATES[1] * BUNDLE_CHANCE_RATIO;
        if (Math.random() < bundleChance) {
          isBundle = true;
          bundleQuantity = 3; // Cụm 3 thẻ giống nhau
        }
      } else if (rarity === 2) {
        // 2★: bundle chance = 1/3 × 20% ≈ 7%
        const bundleChance = GAME_CONSTANTS.DROP_RATES[2] * BUNDLE_CHANCE_RATIO;
        if (Math.random() < bundleChance) {
          isBundle = true;
          bundleQuantity = 2; // Cụm 2 thẻ giống nhau
        }
      }

      // Ưu tiên loại thiếu: 50% slot pick từ top 3 loại deficient
      let typeFilter: any = { not: 'CREW' };
      if (Math.random() < 0.5 && deficientTypes.length > 0) {
        const priorityType = deficientTypes[Math.floor(Math.random() * deficientTypes.length)];
        typeFilter = priorityType;
      }

      const cards = await prisma.card.findMany({
        where: { rarity, type: typeFilter },
        include: { effects: true },
      });

      // Fallback: nếu không tìm thấy thẻ theo type ưu tiên → random tất cả
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

    // ============================================================
    // CREW SLOT — 1 slot riêng hiển thị crew chưa sở hữu
    // ============================================================
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

    return NextResponse.json({
      shopUnlocked: true,
      gold: Number(user.gold),
      items: shopItems,
      crewSlot,
      pityCounter: user.totalPacksOpened % PITY_INTERVAL,
      nextPityAt: PITY_INTERVAL - (user.totalPacksOpened % PITY_INTERVAL),
    });

  } catch (error) {
    console.error('Shop items error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// =============================================
// POST /api/shop/items — Mua thẻ/cụm/pack/x2pack
// =============================================
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { cardId, type, cost, bundleQuantity } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    if (Number(user.gold) < cost) {
      return NextResponse.json({ error: 'Không đủ vàng!' }, { status: 400 });
    }

    // ============================
    // PACK hoặc X2_PACK
    // ============================
    if (type === 'PACK' || type === 'X2_PACK') {
      const packCount = type === 'X2_PACK' ? 2 : 1;
      const totalCards = GAME_CONSTANTS.PACK_CARDS_COUNT * packCount;
      const newPacksOpened = user.totalPacksOpened + packCount;

      const packCards = [];
      for (let i = 0; i < totalCards; i++) {
        // Pity system: pack thứ 8 (modulo) → 1 thẻ đảm bảo 4★-5★
        let rarity: number;

        // Check nếu đây là thẻ đầu tiên của pack pity
        const currentPackNumber = user.totalPacksOpened + Math.floor(i / GAME_CONSTANTS.PACK_CARDS_COUNT) + 1;
        const isPityPack = currentPackNumber % PITY_INTERVAL === 0;

        if (isPityPack && i % GAME_CONSTANTS.PACK_CARDS_COUNT === 0) {
          // Thẻ đầu tiên của pack pity: 50% 4★, 50% 5★
          rarity = Math.random() < 0.5 ? 4 : 5;
        } else {
          rarity = rollRarity();
        }

        const cards = await prisma.card.findMany({ where: { rarity, type: { not: 'CREW' } } });
        if (cards.length > 0) {
          const randomCard = cards[Math.floor(Math.random() * cards.length)];
          packCards.push(randomCard);
        }
      }

      // Trừ gold + update packs opened + track spending
      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          gold: { decrement: cost },
          totalShopSpent: { increment: cost },
          totalPacksOpened: newPacksOpened,
        },
      });

      // Thêm thẻ vào inventory
      for (const card of packCards) {
        await prisma.userInventory.upsert({
          where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
          create: { userId: auth.userId, cardId: card.id, quantity: 1 },
          update: { quantity: { increment: 1 } },
        });
      }

      return NextResponse.json({
        message: type === 'X2_PACK'
          ? `🎁 Mở x2 Pack thành công! Nhận ${packCards.length} thẻ!`
          : `Mở Pack thành công! Nhận ${packCards.length} thẻ!`,
        cards: packCards.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          rarity: c.rarity,
          statPower: c.statPower,
          statHeat: c.statHeat,
          statStability: c.statStability,
        })),
        remainingGold: Number(user.gold) - cost,
        totalPacksOpened: newPacksOpened,
        wasPity: packCards.some((_, idx) => {
          const packNum = user.totalPacksOpened + Math.floor(idx / GAME_CONSTANTS.PACK_CARDS_COUNT) + 1;
          return packNum % PITY_INTERVAL === 0 && idx % GAME_CONSTANTS.PACK_CARDS_COUNT === 0;
        }),
      });
    }

    // ============================
    // BUNDLE (Cụm thẻ)
    // ============================
    if (type === 'BUNDLE') {
      if (!cardId || !bundleQuantity || bundleQuantity < 2) {
        return NextResponse.json({ error: 'Thiếu thông tin cụm thẻ' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          gold: { decrement: cost },
          totalShopSpent: { increment: cost },
        },
      });

      await prisma.userInventory.upsert({
        where: { userId_cardId: { userId: auth.userId, cardId } },
        create: { userId: auth.userId, cardId, quantity: bundleQuantity },
        update: { quantity: { increment: bundleQuantity } },
      });

      return NextResponse.json({
        message: `📦 Mua cụm ${bundleQuantity} thẻ thành công!`,
        remainingGold: Number(user.gold) - cost,
      });
    }

    // ============================
    // CARD hoặc CREW (Thẻ lẻ)
    // ============================
    if (!cardId) {
      return NextResponse.json({ error: 'Thiếu cardId' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: {
        gold: { decrement: cost },
        totalShopSpent: { increment: cost },
      },
    });

    await prisma.userInventory.upsert({
      where: { userId_cardId: { userId: auth.userId, cardId } },
      create: { userId: auth.userId, cardId, quantity: 1 },
      update: { quantity: { increment: 1 } },
    });

    return NextResponse.json({
      message: 'Mua thẻ thành công!',
      remainingGold: Number(user.gold) - cost,
    });

  } catch (error) {
    console.error('Shop buy error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
