// GET /api/game/perks - Lấy danh sách đặc quyền + trạng thái unlock
// POST /api/game/perks - Chọn đặc quyền cho run hiện tại
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        endings: { include: { ending: true } },
        achievements: { include: { achievement: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const allPerks = await prisma.starterPerk.findMany();

    // Check unlock status for each perk
    const perksWithStatus = allPerks.map((perk) => {
      let unlocked = perk.isDefault;

      if (!unlocked && perk.unlockCondition) {
        switch (perk.unlockCondition) {
          case 'GOOD_ENDING':
            unlocked = user.endings.some((e: any) => e.ending.name === 'Good Ending');
            break;
          case 'TOTAL_EXPLOSIONS_15':
            unlocked = user.totalExplosions >= 15;
            break;
          case 'OWN_8_CREW':
            // Check across all inventory (crew cards owned)
            // This is a persistent check - we need to count crew cards ever owned
            // For simplicity, check current inventory crew count
            unlocked = false; // Will be checked separately
            break;
          case 'TOTAL_SHOP_SPENT_10000':
            unlocked = Number(user.totalShopSpent) >= 10000;
            break;
          case 'REACH_LEVEL_10':
            unlocked = user.level >= 10;
            break;
        }
      }

      return {
        id: perk.id,
        code: perk.code,
        name: perk.name,
        description: perk.description,
        effectType: perk.effectType,
        effectValue: perk.effectValue,
        isDefault: perk.isDefault,
        unlocked,
      };
    });

    // Special check for OWN_8_CREW - count unique crew cards in inventory
    const crewCount = await prisma.userInventory.count({
      where: {
        userId: auth.userId,
        card: { type: 'CREW' },
        quantity: { gte: 1 },
      },
    });
    // Also check achievements for crew unlocks
    const crewPerk = perksWithStatus.find(p => p.code === GAME_CONSTANTS.PERK_CODES.CONNECTIONS);
    if (crewPerk && !crewPerk.unlocked) {
      crewPerk.unlocked = crewCount >= 8;
    }

    return NextResponse.json({
      perks: perksWithStatus,
      activePerkCode: user.activePerkCode,
      canSelectPerk: user.currentDay === 1 && !user.activePerkCode,
    });

  } catch (error) {
    console.error('Get perks error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { perkCode } = await request.json();
    if (!perkCode) {
      return NextResponse.json({ error: 'Chưa chọn đặc quyền' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        endings: { include: { ending: true } },
      },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Chỉ được chọn perk khi day = 1
    if (user.currentDay !== 1) {
      return NextResponse.json({ error: 'Chỉ được chọn đặc quyền vào Ngày 1!' }, { status: 400 });
    }
    // Allow re-selecting perk (remove check for activePerkCode)

    // Verify perk exists
    const perk = await prisma.starterPerk.findUnique({ where: { code: perkCode } });
    if (!perk) {
      return NextResponse.json({ error: 'Đặc quyền không tồn tại' }, { status: 404 });
    }

    // Verify perk is unlocked (skip check for default)
    if (!perk.isDefault) {
      let unlocked = false;
      switch (perk.unlockCondition) {
        case 'GOOD_ENDING':
          unlocked = user.endings.some((e: any) => e.ending.name === 'Good Ending');
          break;
        case 'TOTAL_EXPLOSIONS_15':
          unlocked = user.totalExplosions >= 15;
          break;
        case 'OWN_8_CREW': {
          const crewCount = await prisma.userInventory.count({
            where: { userId: auth.userId, card: { type: 'CREW' }, quantity: { gte: 1 } },
          });
          unlocked = crewCount >= 8;
          break;
        }
        case 'TOTAL_SHOP_SPENT_10000':
          unlocked = Number(user.totalShopSpent) >= 10000;
          break;
        case 'REACH_LEVEL_10':
          unlocked = user.level >= 10;
          break;
      }
      if (!unlocked) {
        return NextResponse.json({ error: 'Đặc quyền chưa được mở khóa!' }, { status: 403 });
      }
    }

    // Apply perk effects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { activePerkCode: perkCode };
    let message = `Đã chọn đặc quyền: ${perk.name}!`;

    // Check if re-selecting same perk - don't stack effects
    const isReselecting = user.activePerkCode === perkCode;

    switch (perkCode) {
      case GAME_CONSTANTS.PERK_CODES.STARTUP_FUND:
        if (!isReselecting) {
          updates.gold = { increment: 200 };
          message += ' +200 Gold!';
        } else {
          message += ' (Đã áp dụng)';
        }
        break;

      case GAME_CONSTANTS.PERK_CODES.OLD_STASH: {
        // Give 5 random 2-3★ cards (applied after update)
        if (!isReselecting) {
          message += ' Nhận 5 thẻ 2-3★ ngẫu nhiên!';
        } else {
          message += ' (Đã áp dụng)';
        }
        break;
      }

      case GAME_CONSTANTS.PERK_CODES.HOT_HANDS:
        // Heat threshold handled in workshop/test route
        message += ' Ngưỡng nổ máy tăng lên 115%!';
        break;

      case GAME_CONSTANTS.PERK_CODES.CONNECTIONS:
        if (!isReselecting) {
          updates.crewSlots = { increment: 1 };
          message += ` +1 Crew Slot! (Hiện có: ${user.crewSlots + 1})`;
        } else {
          message += ' (Đã áp dụng)';
        }
        break;

      case GAME_CONSTANTS.PERK_CODES.VIP_CARD:
        // Shop discount handled in shop/items route
        message += ' Shop giảm giá 20% trong 10 ngày đầu!';
        break;

      case GAME_CONSTANTS.PERK_CODES.TECH_GENIUS:
        if (!isReselecting) {
          updates.techPoints = { increment: 100 };
          message += ' +100 Tech Points!';
        } else {
          message += ' (Đã áp dụng)';
        }
        break;
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: updates,
    });

    // OLD_STASH: Give 5 random 2-3★ cards (only if not re-selecting)
    if (perkCode === GAME_CONSTANTS.PERK_CODES.OLD_STASH && !isReselecting) {
      const rarity2Cards = await prisma.card.findMany({ where: { rarity: 2, type: { not: 'CREW' } } });
      const rarity3Cards = await prisma.card.findMany({ where: { rarity: 3, type: { not: 'CREW' } } });
      const pool = [...rarity2Cards, ...rarity3Cards];

      const givenCards: string[] = [];
      for (let i = 0; i < 5 && pool.length > 0; i++) {
        const card = pool[Math.floor(Math.random() * pool.length)];
        await prisma.userInventory.upsert({
          where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
          create: { userId: auth.userId, cardId: card.id, quantity: 1 },
          update: { quantity: { increment: 1 } },
        });
        givenCards.push(card.name);
      }
      message += ` Thẻ nhận: ${givenCards.join(', ')}`;
    }

    return NextResponse.json({
      message,
      activePerkCode: perkCode,
      perkName: perk.name,
      userState: {
        gold: Number(updatedUser.gold),
        techPoints: Number(updatedUser.techPoints),
        crewSlots: updatedUser.crewSlots,
      },
    });

  } catch (error) {
    console.error('Select perk error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
