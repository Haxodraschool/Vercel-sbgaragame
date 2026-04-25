// POST /api/quest/[id]/complete - Hoàn thành quest (SUCCESS/FAILED)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const { id } = await params;
    const questId = parseInt(id);
    const { status, epIslandChoice, babyOilChoice, kimChoice, kimMinigameSuccess, usedCardIds, russiaPhase, vodkaChoice, totalPowerAchieved } = await request.json();

    if (!['SUCCESS', 'FAILED'].includes(status)) {
      return NextResponse.json({ error: 'Status phải là SUCCESS hoặc FAILED' }, { status: 400 });
    }

    // Get quest
    const quest = await prisma.dailyQuest.findFirst({
      where: { id: questId, userId: auth.userId },
      include: { bossConfig: true },
    });

    if (!quest) {
      return NextResponse.json({ error: 'Không tìm thấy quest' }, { status: 404 });
    }

    if (quest.status !== 'PENDING') {
      return NextResponse.json({ error: 'Quest đã hoàn thành rồi' }, { status: 400 });
    }

    // Update quest status
    await prisma.dailyQuest.update({
      where: { id: questId },
      data: { status },
    });

    // Update user based on result
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    let smugglerPenaltyApplied = 0;
    let actualGoldReward = quest.rewardGold;

    if (status === 'SUCCESS') {
      let goldReward = quest.rewardGold;

      // DONALD_TRUMP Custom Rewards
      if (quest.bossConfig?.specialCondition === 'DONALD_TRUMP') {
        goldReward = 4700;
        actualGoldReward = goldReward;
        updates.gold = { increment: goldReward };
        updates.garageHealth = Math.min(100, user.garageHealth + 47);
        updates.hasDefeatedDonaldTrump = true; // Unlock Nga Đại Đế spawn bonus
      } else if (quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR') {
        // Dynamic gold: phase 1 = totalPower, phase 2 = totalPower × 2
        const multiplier = (russiaPhase === 2) ? 2 : 1;
        const dynamicGold = (totalPowerAchieved || 0) * multiplier;
        goldReward = dynamicGold;
        actualGoldReward = dynamicGold;
        updates.gold = { increment: dynamicGold };
        updates.exp = { increment: GAME_CONSTANTS.BOSS_SUCCESS_EXP };
      } else {
        // KIM_JONG_UN Custom Logic & Buff Multipliers
        // Apply Underworld Buff (+50% profit equivalent to 1.5 multiplier)
        if (user.hasUnderworldBuff) {
          goldReward = Math.floor(goldReward * 1.5);
        }
        
        // Apply Kim Jong Un Minigame Buff (x2 - x3 value for North Korean customers)
        if (user.isInNorthKorea && user.hasKimBuff && !quest.isBoss) {
          const m = Math.random() < 0.5 ? 2 : 3;
          goldReward *= m;
        }

        // Apply smuggler penalty if active (15% gold reduction)
        if (user.smugglerPenalty > 0) {
          smugglerPenaltyApplied = Math.floor(goldReward * user.smugglerPenalty);
          goldReward -= smugglerPenaltyApplied;
        }
        actualGoldReward = goldReward;
        updates.exp = { increment: quest.isBoss ? GAME_CONSTANTS.BOSS_SUCCESS_EXP : GAME_CONSTANTS.SUCCESS_EXP };
      }
      
      // Lưu base gold reward cho tất cả quest thắng (ngoại trừ đã xử lý riêng ở trên)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!updates.gold) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existingInc = (updates.gold as any)?.increment || 0;
        updates.gold = { increment: existingInc + goldReward };
      }

      // +Uy tín khi thắng: +1 quest thường, +5 boss
      const healthBonus = quest.isBoss
        ? GAME_CONSTANTS.BOSS_SUCCESS_HEALTH_BONUS
        : GAME_CONSTANTS.SUCCESS_HEALTH_BONUS;
      // Chỉ cộng nếu chưa bị boss đặc biệt ghi đè garageHealth
      if (updates.garageHealth === undefined) {
        updates.garageHealth = Math.min(100, user.garageHealth + healthBonus);
      }
    }

    // ============================================================
    // BUDGET PROFIT BONUS - Chỉ áp dụng cho khách thường (không phải Boss)
    // Người chơi luôn nhận được customerBudget như phần thưởng thêm
    // ============================================================
    let budgetProfit = 0;
    if (status === 'SUCCESS' && !quest.isBoss && quest.customerBudget > 0) {
      // Luôn cộng customerBudget vào gold (không trừ chi phí thẻ)
      budgetProfit = quest.customerBudget;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentGoldInc = (updates.gold as any)?.increment || quest.rewardGold || 0;
      updates.gold = { increment: currentGoldInc + quest.customerBudget };
      actualGoldReward = (actualGoldReward || quest.rewardGold || 0) + quest.customerBudget;
    }

    // ============================================================
    // FAILED - trừ uy tín (CHỈ ÁP DỤNG KHI STATUS = FAILED)
    // ============================================================
    if (status === 'FAILED') {
      let penalty = quest.isBoss
        ? GAME_CONSTANTS.BOSS_FAIL_HEALTH_PENALTY
        : GAME_CONSTANTS.FAIL_HEALTH_PENALTY;
        
      // Ghi đè luật Penalty nếu là Boss Đảo chủ EP
      if (quest.bossConfig?.specialCondition === 'EP_ISLAND_CHOICE') {
         // Nhánh YES: Khởi điểm lên đảo đã mất 50 uy tín (có thể đã bị trừ từ FrontEnd nhưng ở đây là BackEnd trừ luôn khi chốt)
         // Nhánh NO: Từ chối mất lòng, nhưng vẫn fail -> mất uy tín mặc định. Hoặc nếu muốn setup riêng cũng được.
         // Tuy nhiên luật user yêu cầu: Nhánh NO khi test fail hoặc win thì đều được +15 uy tín ngay từ lúc trả lời.
      } else if (quest.bossConfig?.specialCondition === 'DONALD_TRUMP') {
         // Đỗ Nam Trung failure bypasses standard health penalty.
         // He applies a tax modifier instead. The health penalty can be 0 or small.
         penalty = 0; 
      }
      
      const newHealth = Math.max(0, user.garageHealth - penalty);
      updates.garageHealth = newHealth;
    }

    // ============================================================
    // EP_ISLAND_CHOICE - REPUTATION OVERRIDE
    // Theo yêu cầu: Chọn YES -> trừ 50 Uy Tín, Chọn NO -> tăng 15 Uy Tín (bất kể kết quả màn test)
    // ============================================================
    let reputationMessage = '';
    if (quest.bossConfig?.specialCondition === 'EP_ISLAND_CHOICE') {
      if (epIslandChoice === 'YES') {
        const newHealth = Math.max(0, (updates.garageHealth ?? user.garageHealth) - 50);
        updates.garageHealth = newHealth;
        reputationMessage = '(Lên đảo bí mật: -50 Uy Tín) ';
        // Unlock Donald Trump Boss appearance
        if (status === 'SUCCESS') {
          updates.hasDefeatedEP = true;
        }
      } else if (epIslandChoice === 'NO') {
        const newHealth = Math.min(100, (updates.garageHealth ?? user.garageHealth) + 15);
        updates.garageHealth = newHealth;
        reputationMessage = '(Từ chối lên đảo: +15 Uy Tín) ';
      }
    }

    // ============================================================
    // BABY_OIL_CHOICE - REPUTATION & CUSTOMERS LEAVE OVERRIDE
    // Theo yêu cầu: nếu FAILED hoặc chọn NO -> trừ 45% uy tín, tất cả khách trong ngày bỏ đi
    // ============================================================
    if (quest.bossConfig?.specialCondition === 'BABY_OIL_CHOICE') {
      if (status === 'FAILED' || babyOilChoice === 'NO') {
        const penaltyAmount = Math.floor(user.garageHealth * 0.45); // Trừ 45% uy tín gốc
        const newHealth = Math.max(0, user.garageHealth - penaltyAmount);
        updates.garageHealth = newHealth;
        reputationMessage = `(Chúa tể dầu em bé tức giận đổ dầu lên người bạn! -${penaltyAmount} Uy tín. Các khách khác sợ quá bỏ chạy hết!) `;
        
        // Khách bỏ đi = Fail hết quest pending trong ngày (trừ Final Round)
        if (!user.isFinalRound) {
          await prisma.dailyQuest.updateMany({
            where: {
              userId: user.id,
              dayNumber: user.currentDay,
              status: 'PENDING',
              id: { not: questId }
            },
            data: { status: 'FAILED' }
          });
        }
      } else if (status === 'SUCCESS') {
        // Thưởng đặc biệt: +2500 Gold + 2 Pack ngẫu nhiên
        const BABY_OIL_GOLD_BONUS = 2500;
        const BABY_OIL_PACK_COUNT = 2;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const currentInc = (updates.gold as any)?.increment || 0;
        updates.gold = { increment: currentInc + BABY_OIL_GOLD_BONUS };

        // Mở 2 pack ngẫu nhiên (mỗi pack 5 thẻ)
        const rarityWeights = [0, 0.5, 0.3, 0.15, 0.04, 0.01]; // [unused, 1★, 2★, 3★, 4★, 5★]
        const rollRarity = (): number => {
          const r = Math.random();
          let cum = 0;
          for (let i = 1; i <= 5; i++) {
            cum += rarityWeights[i];
            if (r <= cum) return i;
          }
          return 1;
        };

        const CARDS_PER_PACK = GAME_CONSTANTS.PACK_CARDS_COUNT;
        for (let p = 0; p < BABY_OIL_PACK_COUNT; p++) {
          for (let i = 0; i < CARDS_PER_PACK; i++) {
            const rarity = rollRarity();
            const cards = await prisma.card.findMany({ where: { rarity }, take: 50 });
            if (cards.length > 0) {
              const card = cards[Math.floor(Math.random() * cards.length)];
              await prisma.userInventory.upsert({
                where: { userId_cardId: { userId: auth.userId, cardId: card.id } },
                create: { userId: auth.userId, cardId: card.id, quantity: 1 },
                update: { quantity: { increment: 1 } },
              });
            }
          }
        }

        reputationMessage = `(Chúa tể dầu em bé hài lòng! +${BABY_OIL_GOLD_BONUS} Gold và ${BABY_OIL_PACK_COUNT} Gói Thẻ Bí Ẩn!) `;
      }
    }

    // ============================================================
    // DONALD_TRUMP - TAXATION OVERRIDE
    // ============================================================
    if (quest.bossConfig?.specialCondition === 'DONALD_TRUMP') {
      if (status === 'SUCCESS') {
        updates.shopTaxModifier = 0.953; // Giảm 4.7% giá
        updates.shopTaxExpiresAt = user.currentDay + 1; // Áp dụng ở "shop kế tiếp" (ngày kế tiếp)
        reputationMessage = '(Đỗ Nam Trung ban thưởng: +47 uy tín và giảm 4.7% thuế ở Shop ngày mai!) ';
      } else {
        updates.shopTaxModifier = 1.47; // Tăng 47% giá
        updates.shopTaxExpiresAt = user.currentDay + 1;
        reputationMessage = '(Đỗ Nam Trung nổi giận! Hắn đánh thuế Shop ngày mai tăng thêm 47%!) ';
      }
    }

    // ============================================================
    // KIM_JONG_UN - STORYLINE OVERRIDE
    // ============================================================
    if (quest.bossConfig?.specialCondition === 'KIM_JONG_UN') {
      if (user.isInNorthKorea) {
        if (status === 'SUCCESS') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentInc = (updates.gold as any)?.increment || 0;
          updates.gold = { increment: currentInc + 2000 };
          reputationMessage = '(Chủ Tịch khen ngợi kỹ năng của bạn! +2000 Gold thưởng thêm!) ';
        } else {
          reputationMessage = '(Chủ Tịch không hài lòng với xe của bạn...) ';
        }
      } else {
        if (kimChoice === 'YES') {
          updates.isInNorthKorea = true;
          updates.northKoreaDayCount = 1;

          if (kimMinigameSuccess) {
             updates.hasKimBuff = true;
             reputationMessage = '(Chủ Tịch rất vừa ý với màn vỗ tay của bạn! Quán xe nhận buff Danh Tiếng Chủ Tịch x2-x3 thu nhập!) ';
          } else {
             reputationMessage = '(Bạn vỗ tay/cười không đạt yêu cầu... Chủ Tịch không vui lắm.) ';
          }
        } else if (kimChoice === 'NO') {
          // Bad Ending logic handled in GAME OVER block
          reputationMessage = '(Bạn đã từ chối lời mời của Chủ Tịch... Kết cục đã định.) ';
        }
      }
    }

    // ============================================================
    // RUSSIA_EMPEROR - BUFF MOSKVA & PHASE TRACKING
    // ============================================================
    if (quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR') {
      if (status === 'SUCCESS' && russiaPhase === 2) {
        // Hoàn thành cả 2 phase → bật buff Hào quang Moskva
        updates.hasMoscowBuff = true;
        updates.moscowBuffDay = user.currentDay + 1;
        reputationMessage = `(Nga Đại Đế kính phục! Buff Hào Quang Moskva: +20% Power ngày mai! +${(totalPowerAchieved || 0) * 2} Gold) `;
      } else if (status === 'SUCCESS' && russiaPhase === 1) {
        reputationMessage = `(Nga Đại Đế hỏi: \"Có Vodka không?\" Chuẩn bị nhiệm vụ thứ 2! +${totalPowerAchieved || 0} Gold) `;
      } else if (status === 'FAILED') {
        reputationMessage = '(Nga Đại Đế thất vọng...) ';
      }
    }

    // ============================================================
    // UPDATE INVENTORY: TRỪ THẺ ĐÃ SỬ DỤNG (ngoại trừ CREW)
    // ============================================================
    let updatedInventory: any[] = [];
    if (Array.isArray(usedCardIds) && usedCardIds.length > 0) {
      // Lấy thông tin các thẻ đã sử dụng để xác định loại (CREW không bị trừ)
      const usedCardsInfo = await prisma.card.findMany({
        where: { id: { in: usedCardIds as number[] } },
        select: { id: true, type: true }
      });
      
      // Tạo map cardId -> type để dễ tra cứu
      const cardTypeMap = new Map(usedCardsInfo.map((c: any) => [c.id, c.type]));
      
      // Group cards to handle duplicates in the used list (chỉ tính các thẻ không phải CREW)
      const cardsToDeduct: Record<number, number> = {};
      for (const cardId of usedCardIds) {
        if (typeof cardId === 'number') {
          const cardType = cardTypeMap.get(cardId);
          // Crew cards không bị trừ khi sử dụng
          if (cardType !== 'CREW') {
            cardsToDeduct[cardId] = (cardsToDeduct[cardId] || 0) + 1;
          }
        }
      }
      
      // Chỉ trừ thẻ nếu có thẻ cần trừ (không phải CREW)
      if (Object.keys(cardsToDeduct).length > 0) {
        for (const [cardId, count] of Object.entries(cardsToDeduct)) {
          await prisma.userInventory.updateMany({
            where: {
              userId: auth.userId,
              cardId: parseInt(cardId),
              quantity: { gte: count }
            },
            data: {
              quantity: { decrement: count }
            }
          });
        }

        // Xóa các bản ghi có quantity = 0
        await prisma.userInventory.deleteMany({
          where: {
            userId: auth.userId,
            quantity: { lte: 0 }
          }
        });
      }

      // Lấy inventory mới để trả về frontend
      updatedInventory = await prisma.userInventory.findMany({
        where: { userId: auth.userId, quantity: { gt: 0 } },
        include: { card: true }
      });
    }

    let updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: updates,
    });

    // ============================================================
    // LEVEL UP CHECK - 1000 base + 100 per level scaling
    // ============================================================
    const getExpForLevel = (lvl: number) => 1000 + (lvl - 1) * 100;
    let currentExp = Number(updatedUser.exp);
    let currentLevel = updatedUser.level;
    let leveledUp = false;
    
    while (currentExp >= getExpForLevel(currentLevel)) {
      currentExp -= getExpForLevel(currentLevel);
      currentLevel += 1;
      leveledUp = true;
    }
    
    if (leveledUp) {
      updatedUser = await prisma.user.update({
        where: { id: auth.userId },
        data: { level: currentLevel, exp: currentExp },
      });
    }

    // ============================================================
    // EP_ISLAND_CHOICE - SPECIAL REWARDS (3 Packs + 1 4*)
    // ============================================================
    let extraRewardsMessage = '';
    if (status === 'SUCCESS' && quest.bossConfig?.specialCondition === 'EP_ISLAND_CHOICE') {
      // 3 pack card (tương đương 9 thẻ ngẫu nhiên bất kỳ)
      const allCards = await prisma.card.findMany();
      if (allCards.length > 0) {
        const cardsToGive = [];
        
        // Mở 3 pack (9 random thẻ linh kiện)
        for (let i = 0; i < 9; i++) {
          const randCard = allCards[Math.floor(Math.random() * allCards.length)];
          cardsToGive.push(randCard.id);
        }
        
        // 1 thẻ 4* ngẫu nhiên
        const fourStarCards = allCards.filter((c: any) => c.rarity === 4);
        if (fourStarCards.length > 0) {
          const rand4Star = fourStarCards[Math.floor(Math.random() * fourStarCards.length)];
          cardsToGive.push(rand4Star.id);
        }
        
        // Gắn vào kho đồ
        for (const cId of cardsToGive) {
          await prisma.userInventory.upsert({
            where: { userId_cardId: { userId: auth.userId, cardId: cId } },
            create: { userId: auth.userId, cardId: cId, quantity: 1 },
            update: { quantity: { increment: 1 } }
          });
        }
        extraRewardsMessage = ' + 3 Pack linh kiện & 1 Thẻ 4 Sao đặc biệt!';
      }
    }

    // ============================================================
    // ENDING CHECKS
    // ============================================================
    let gameOver = false;
    let ending: string | null = null;

    // 1. Wasted Potential - Uy tín = 0
    if (updatedUser.garageHealth <= 0) {
      gameOver = true;
      ending = 'Wasted Potential';
    }

    // 1.5. Bị Tiêu Diệt Bởi Chủ Tịch (Kim Jong Un - NO Branch)
    if (quest.bossConfig?.specialCondition === 'KIM_JONG_UN' && kimChoice === 'NO') {
      gameOver = true;
      ending = 'Bị Tiêu Diệt Bởi Chủ Tịch';
    }

    // 2. Final Round endings
    if (!gameOver && user.isFinalRound) {
      // Get all Final Round quests (day 51)
      const finalQuests = await prisma.dailyQuest.findMany({
        where: { userId: auth.userId, dayNumber: 51 },
        include: { bossConfig: true },
      });

      if (status === 'FAILED' && quest.isBoss) {
        // Check for Boss Hidden Ending (specific boss fail)
        const bossName = quest.bossConfig?.name;
        if (bossName === 'Kẻ Bí Ẩn') {
          ending = 'Bóng Ma Tốc Độ';
        } else {
          // The Missing Percent - Fail bất kỳ boss nào trong Final Round
          ending = 'The Missing Percent';
        }
        gameOver = true;
      }

      // Check if all Final Round quests are completed
      const allCompleted = finalQuests.every(
        (q: any) => q.status === 'SUCCESS' || q.status === 'FAILED'
      );
      const allSuccess = finalQuests.every((q: any) => q.status === 'SUCCESS');

      if (allCompleted && allSuccess && finalQuests.length >= GAME_CONSTANTS.FINAL_ROUND_BOSSES) {
        // Invictus - Thắng hết 10 Boss
        ending = 'Invictus';
        gameOver = true;
      }
    }

    // Unlock ending if earned
    if (ending) {
      const endingRecord = await prisma.ending.findFirst({
        where: { name: ending },
      });
      if (endingRecord) {
        await prisma.userEnding.upsert({
          where: { userId_endingId: { userId: auth.userId, endingId: endingRecord.id } },
          create: { userId: auth.userId, endingId: endingRecord.id },
          update: {},
        });
      }
    }

    return NextResponse.json({
      message: status === 'SUCCESS'
        ? (smugglerPenaltyApplied > 0
          ? `Hoàn thành xuất sắc! +${actualGoldReward} vàng (🕶️ Tay Buôn Lậu lấy ${smugglerPenaltyApplied} vàng). ${reputationMessage}${extraRewardsMessage}`
          : `Hoàn thành xuất sắc! +${actualGoldReward} vàng. ${reputationMessage}${extraRewardsMessage}`)
        : `Xe nổ máy! Uy tín bị ảnh hưởng. ${reputationMessage}`,
      questStatus: status,
      rewards: status === 'SUCCESS' ? {
        gold: actualGoldReward,
        originalGold: quest.rewardGold,
        customerBudget: quest.customerBudget || 0,
        budgetProfit: budgetProfit,
        smugglerPenalty: smugglerPenaltyApplied,
        exp: quest.isBoss ? GAME_CONSTANTS.BOSS_SUCCESS_EXP : GAME_CONSTANTS.SUCCESS_EXP,
      } : null,
      penalty: status === 'FAILED' ? {
        healthLost: quest.isBoss
          ? GAME_CONSTANTS.BOSS_FAIL_HEALTH_PENALTY
          : GAME_CONSTANTS.FAIL_HEALTH_PENALTY,
      } : null,
      userState: {
        gold: Number(updatedUser.gold),
        garageHealth: updatedUser.garageHealth,
        exp: Number(updatedUser.exp),
      },
      updatedInventory: updatedInventory.map(item => ({
        cardId: item.cardId,
        quantity: item.quantity,
        card: item.card,
      })),
      gameOver,
      ending,
      isFinalRound: user.isFinalRound,
    });

  } catch (error) {
    console.error('Complete quest error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
