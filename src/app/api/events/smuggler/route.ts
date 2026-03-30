// GET /api/events/smuggler - Xem shop buôn lậu (khi event active)
// POST /api/events/smuggler - Mua/Bán thẻ với Tay Buôn Lậu
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

const SMUGGLER_EVENT_NAME = 'Tay Buôn Lậu Gõ Cửa';
const SMUGGLER_BUY_DISCOUNT = 0.6;  // Mua = 60% giá gốc (giảm 40%)
const SMUGGLER_SELL_RATE = 0.5;     // Bán = 50% giá gốc
const SMUGGLER_BUY_HEALTH_COST = 5; // -5 uy tín mỗi lần mua
const SMUGGLER_SHOP_SIZE = 4;       // 4 món hiếm

// ============================================================
// Helper: Check if smuggler event is active for user
// ============================================================
async function isSmuglerActive(userId: number): Promise<boolean> {
  const smugglerEvent = await prisma.gameEvent.findFirst({
    where: { name: SMUGGLER_EVENT_NAME },
  });
  if (!smugglerEvent) return false;

  const activeEvent = await prisma.userActiveEvent.findFirst({
    where: {
      userId,
      eventId: smugglerEvent.id,
      isAccepted: true,
      remainingTurns: { gt: 0 },
    },
  });

  return !!activeEvent;
}

// ============================================================
// GET - Show smuggler shop
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Check if smuggler event is active
    const active = await isSmuglerActive(auth.userId);
    if (!active) {
      return NextResponse.json(
        { error: 'Tay Buôn Lậu chưa xuất hiện! Chờ sự kiện ngẫu nhiên.', smugglerActive: false },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Generate smuggler's rare item shop (rarity 3-5)
    const rareCards = await prisma.card.findMany({
      where: {
        rarity: { gte: 3 },
        type: { not: 'CREW' }, // Không bán crew
      },
      include: { effects: true },
    });

    // Bám sát Underworld Buff để giảm giá thêm (-20%)
    let discountMod = 1.0;
    if (user.hasUnderworldBuff) discountMod = 0.8;

    // Random pick items for shop
    const shuffled = rareCards.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shopItems = shuffled.slice(0, SMUGGLER_SHOP_SIZE).map((card: any) => ({
      id: card.id,
      name: card.name,
      type: card.type,
      rarity: card.rarity,
      statPower: card.statPower,
      statHeat: card.statHeat,
      statStability: card.statStability,
      description: card.description,
      originalCost: card.cost,
      // Tính giá base sau đó áp dụng discount của thế giới ngầm nếu có
      smugglerPrice: Math.floor(Math.floor(card.cost * SMUGGLER_BUY_DISCOUNT) * discountMod),
      healthCost: SMUGGLER_BUY_HEALTH_COST,
      effects: card.effects,
    }));

    // Get user's sellable inventory
    const inventory = await prisma.userInventory.findMany({
      where: { userId: auth.userId, quantity: { gt: 0 } },
      include: {
        card: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellableItems = inventory.map((inv: any) => ({
      cardId: inv.card.id,
      name: inv.card.name,
      type: inv.card.type,
      rarity: inv.card.rarity,
      quantity: inv.quantity,
      originalCost: inv.card.cost,
      sellPrice: Math.floor(inv.card.cost * SMUGGLER_SELL_RATE),
    }));

    return NextResponse.json({
      smugglerActive: true,
      message: '🕶️ Tay Buôn Lậu: "Hàng xịn đây... nhưng cái gì cũng có cái giá!"',
      gold: Number(user.gold),
      garageHealth: user.garageHealth,
      buyDiscount: `${Math.round((1 - SMUGGLER_BUY_DISCOUNT) * 100)}%`,
      sellRate: `${Math.round(SMUGGLER_SELL_RATE * 100)}%`,
      healthCostPerBuy: SMUGGLER_BUY_HEALTH_COST,
      shopItems,
      sellableItems,
    });

  } catch (error) {
    console.error('Smuggler shop error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

// ============================================================
// POST - Buy or Sell with smuggler
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // Check if smuggler event is active
    const active = await isSmuglerActive(auth.userId);
    if (!active) {
      return NextResponse.json(
        { error: 'Tay Buôn Lậu đã rời đi! Không thể giao dịch.', smugglerActive: false },
        { status: 403 }
      );
    }

    const { action, cardId, quantity = 1 } = await request.json();

    if (!['buy', 'sell'].includes(action)) {
      return NextResponse.json(
        { error: 'Action phải là "buy" hoặc "sell"' },
        { status: 400 }
      );
    }

    if (!cardId) {
      return NextResponse.json({ error: 'Thiếu cardId' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: 'Thẻ không tồn tại' }, { status: 404 });
    }

    // ============================================================
    // BUY from smuggler
    // ============================================================
    if (action === 'buy') {
      // Only rare+ cards (rarity 3+)
      if (card.rarity < 3 || card.type === 'CREW') {
        return NextResponse.json(
          { error: 'Tay Buôn Lậu chỉ bán linh kiện hiếm (3★+), không bán crew!' },
          { status: 400 }
        );
      }

      let discountMod = 1.0;
      if (user.hasUnderworldBuff) discountMod = 0.8;

      const smugglerPrice = Math.floor(Math.floor(card.cost * SMUGGLER_BUY_DISCOUNT) * discountMod);

      // Check gold
      if (Number(user.gold) < smugglerPrice) {
        return NextResponse.json(
          { error: `Không đủ vàng! Cần ${smugglerPrice}, có ${Number(user.gold)}.` },
          { status: 400 }
        );
      }

      // Check garage health (need at least 5 to buy)
      if (user.garageHealth <= SMUGGLER_BUY_HEALTH_COST) {
        return NextResponse.json(
          { error: `Uy tín quá thấp để giao dịch! Cần ít nhất ${SMUGGLER_BUY_HEALTH_COST + 1} uy tín.` },
          { status: 400 }
        );
      }

      // Deduct gold + health, and mark as bought today for police event logic
      const updatedUser = await prisma.user.update({
        where: { id: auth.userId },
        data: {
          gold: { decrement: smugglerPrice },
          garageHealth: { decrement: SMUGGLER_BUY_HEALTH_COST },
          lastSmugglerBuyDay: user.currentDay, // Ghi nhận đã mua hàng trong ngày này
        },
      });

      // Add card to inventory
      await prisma.userInventory.upsert({
        where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
        create: { userId: auth.userId, cardId: card.id, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });

      return NextResponse.json({
        message: `🕶️ Đã mua "${card.name}" từ Tay Buôn Lậu! (-${smugglerPrice} gold, -${SMUGGLER_BUY_HEALTH_COST} uy tín)`,
        action: 'buy',
        card: {
          id: card.id,
          name: card.name,
          type: card.type,
          rarity: card.rarity,
        },
        paid: smugglerPrice,
        originalPrice: card.cost,
        healthLost: SMUGGLER_BUY_HEALTH_COST,
        remainingGold: Number(updatedUser.gold),
        remainingHealth: updatedUser.garageHealth,
      });
    }

    // ============================================================
    // SELL to smuggler
    // ============================================================
    if (action === 'sell') {
      const sellQty = Math.max(1, Math.floor(quantity));

      // Check inventory
      const inventoryItem = await prisma.userInventory.findUnique({
        where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
      });

      if (!inventoryItem || inventoryItem.quantity < sellQty) {
        return NextResponse.json(
          { error: `Không đủ thẻ "${card.name}" để bán! Có ${inventoryItem?.quantity || 0}, cần ${sellQty}.` },
          { status: 400 }
        );
      }

      const sellPrice = Math.floor(card.cost * SMUGGLER_SELL_RATE) * sellQty;

      // Add gold
      const updatedUser = await prisma.user.update({
        where: { id: auth.userId },
        data: {
          gold: { increment: sellPrice },
        },
      });

      // Remove from inventory
      if (inventoryItem.quantity <= sellQty) {
        await prisma.userInventory.delete({
          where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
        });
      } else {
        await prisma.userInventory.update({
          where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
          data: { quantity: { decrement: sellQty } },
        });
      }

      return NextResponse.json({
        message: `🕶️ Đã bán ${sellQty}x "${card.name}" cho Tay Buôn Lậu! (+${sellPrice} gold)`,
        action: 'sell',
        card: {
          id: card.id,
          name: card.name,
          type: card.type,
          rarity: card.rarity,
        },
        quantity: sellQty,
        sellPrice,
        originalPrice: card.cost,
        pricePerUnit: Math.floor(card.cost * SMUGGLER_SELL_RATE),
        remainingGold: Number(updatedUser.gold),
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });

  } catch (error) {
    console.error('Smuggler trade error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
