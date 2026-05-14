// POST /api/quest/[id]/complete - Hoàn thành quest (thắng hoặc thua)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticateRequest, GAME_CONSTANTS } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const params = await props.params;
    const questId = parseInt(params.id);
    const { status, kimChoice, babyOilChoice, epIslandChoice, russiaPhase, vodkaChoice, usedCardIds, budgetProfit, totalPower, phase1GoldWithheld } = await request.json();

    if (status !== 'SUCCESS' && status !== 'FAILED') {
      return NextResponse.json({ error: 'Status phải là SUCCESS hoặc FAILED' }, { status: 400 });
    }

    // Get quest with boss config
    const quest = await prisma.dailyQuest.findFirst({
      where: { id: questId, userId: auth.userId },
      include: { bossConfig: true },
    });

    if (!quest) {
      return NextResponse.json({ error: 'Quest không tồn tại' }, { status: 404 });
    }

    // Get user
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người chơi' }, { status: 404 });
    }

    // Update quest status (EXCEPT for Russia Emperor Phase 1, which must remain PENDING for Phase 2)
    const isRussiaEmperor = quest.isBoss && quest.bossConfig?.specialCondition === 'RUSSIA_EMPEROR';
    const actualRussiaPhase = (isRussiaEmperor && russiaPhase !== 2) ? 1 : russiaPhase;
    
    if (!(isRussiaEmperor && actualRussiaPhase === 1)) {
      await prisma.dailyQuest.update({
        where: { id: questId },
        data: { status: status as 'SUCCESS' | 'FAILED' },
      });
    }

    // Consume used cards
    if (usedCardIds && Array.isArray(usedCardIds) && usedCardIds.length > 0) {
      const cardCounts = usedCardIds.reduce((acc: Record<number, number>, id: number) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      for (const [cardIdStr, countVal] of Object.entries(cardCounts)) {
        const cardId = parseInt(cardIdStr);
        const count = countVal as number;
        const invItem = await prisma.userInventory.findUnique({
          where: { userId_cardId: { userId: auth.userId, cardId } }
        });
        
        if (invItem) {
          if (invItem.quantity <= count) {
            await prisma.userInventory.delete({
              where: { userId_cardId: { userId: auth.userId, cardId } }
            });
          } else {
            await prisma.userInventory.update({
              where: { userId_cardId: { userId: auth.userId, cardId } },
              data: { quantity: { decrement: count } }
            });
          }
        }
      }
    }

    let garageHealthChange = 0;
    let goldReward = 0;
    let expReward = 0;
    let gameOver = false;
    let endingUnlocked = null;

    if (status === 'SUCCESS') {
      // Calculate base rewards
      expReward = quest.isBoss ? GAME_CONSTANTS.BOSS_SUCCESS_EXP : GAME_CONSTANTS.SUCCESS_EXP;
      garageHealthChange = quest.isBoss ? GAME_CONSTANTS.BOSS_SUCCESS_HEALTH_BONUS : GAME_CONSTANTS.SUCCESS_HEALTH_BONUS;

      // Determine gold reward: Russia Emperor uses power-based formula, others use quest reward

      if (isRussiaEmperor && actualRussiaPhase === 1) {
        goldReward = (totalPower || 0) * 2; // Phase 1: power × 2
      } else if (isRussiaEmperor && actualRussiaPhase === 2) {
        goldReward = (totalPower || 0) * 3; // Phase 2: power × 3
      } else {
        goldReward = quest.rewardGold;
      }

      // Add budget profit from customer budget if provided
      if (budgetProfit && typeof budgetProfit === 'number' && budgetProfit > 0) {
        goldReward += budgetProfit;
      }

      // Apply garage health bonus (capped at 100)
      const newHealth = Math.min(GAME_CONSTANTS.MAX_GARAGE_HEALTH, user.garageHealth + garageHealthChange);
      garageHealthChange = newHealth - user.garageHealth;

      // ═══ Russia Emperor Phase 1: withhold gold, only give EXP + health ═══
      if (isRussiaEmperor && actualRussiaPhase === 1) {
        await prisma.user.update({
          where: { id: auth.userId },
          data: {
            exp: { increment: expReward },
            garageHealth: newHealth,
          },
        });
        return NextResponse.json({
          message: 'Phase 1 hoàn thành! Đang chuyển sang Phase 2...',
          russiaPhase2Pending: true,
          phase1GoldWithheld: goldReward,
          userState: {
            gold: Number(user.gold), // No gold added — withheld for Phase 2
            exp: Number(user.exp) + expReward,
            garageHealth: newHealth,
          },
        });
      }

      // ═══ Russia Emperor Phase 2: combine both phases' gold + Moscow buff ═══
      if (isRussiaEmperor && actualRussiaPhase === 2) {
        const p1Gold = (typeof phase1GoldWithheld === 'number' && phase1GoldWithheld > 0) ? phase1GoldWithheld : 0;
        const combinedGold = goldReward + p1Gold;

        await prisma.user.update({
          where: { id: auth.userId },
          data: {
            gold: { increment: combinedGold },
            exp: { increment: expReward },
            garageHealth: newHealth,
            hasMoscowBuff: true, // Always buff after completing Phase 2
            moscowBuffDay: user.currentDay + 1,
          },
        });

        goldReward = combinedGold; // Override for response
        console.log(`Russia Emperor Phase 2: P1=${p1Gold}, P2=${goldReward - p1Gold}, Total=${combinedGold}`);
      } else {
        // ═══ Standard: add gold + exp + health ═══
        await prisma.user.update({
          where: { id: auth.userId },
          data: {
            gold: { increment: goldReward },
            exp: { increment: expReward },
            garageHealth: newHealth,
          },
        });
      }

      // Boss-specific logic on success (non-Russia)
      if (quest.isBoss && quest.bossConfig) {
        const condition = quest.bossConfig.specialCondition;

        // EP Island: unlock Donald Trump
        if (condition === 'EP_ISLAND_CHOICE') {
          await prisma.user.update({
            where: { id: auth.userId },
            data: { hasDefeatedEP: true },
          });
        }

        // Kim Jong Un: Enter North Korea
        if (condition === 'KIM_JONG_UN') {
          await prisma.user.update({
            where: { id: auth.userId },
            data: { 
              isInNorthKorea: true,
              northKoreaDayCount: 0
            },
          });
        }
      }
    } else {
      // FAILED
      let penalty = quest.isBoss ? GAME_CONSTANTS.BOSS_FAIL_HEALTH_PENALTY : GAME_CONSTANTS.FAIL_HEALTH_PENALTY;
      
      garageHealthChange = -penalty;

      // Special boss failure logic
      if (quest.isBoss && quest.bossConfig) {
        const condition = quest.bossConfig.specialCondition;

        // BABY_OIL_CHOICE: NO = -45 Uy Tín + all customers auto-fail
        if (condition === 'BABY_OIL_CHOICE' && babyOilChoice === 'NO') {
          garageHealthChange = -45;
          await prisma.dailyQuest.updateMany({
            where: {
              userId: auth.userId,
              status: 'PENDING',
              id: { not: quest.id }
            },
            data: { status: 'FAILED' }
          });
        }

        // Kim Jong Un: NO = immediate game over (BAD ENDING)
        if (condition === 'KIM_JONG_UN' && kimChoice === 'NO' && !user.isInNorthKorea) {
          const ending = await prisma.ending.findFirst({ where: { name: 'Bị Tiêu Diệt Bởi Chủ Tịch' } });
          if (ending) {
            await prisma.userEnding.upsert({
              where: { userId_endingId: { userId: auth.userId, endingId: ending.id } },
              create: { userId: auth.userId, endingId: ending.id },
              update: {},
            });
          }
          gameOver = true;
        }


        // KẾ BÍ ẨN trong FINAL ROUND: unlock ending Bóng Ma Tốc Độ
        if (condition === null && quest.bossConfig.name.includes('Bí Ẩn') && user.isFinalRound) {
          const ending = await prisma.ending.findFirst({ where: { name: 'Bóng Ma Tốc Độ' } });
          if (ending) {
            await prisma.userEnding.upsert({
              where: { userId_endingId: { userId: auth.userId, endingId: ending.id } },
              create: { userId: auth.userId, endingId: ending.id },
              update: {},
            });
          }
          endingUnlocked = 'Bóng Ma Tốc Độ';
          gameOver = true; // Ending triggers game over
        }
      }

      // Apply penalty
      const newHealth = Math.max(0, user.garageHealth + garageHealthChange);
      await prisma.user.update({
        where: { id: auth.userId },
        data: { garageHealth: newHealth },
      });

      // Check for game over (garage health = 0)
      if (newHealth === 0 && !gameOver) {
        const ending = await prisma.ending.findFirst({ where: { name: 'Wasted Potential' } });
        if (ending) {
          await prisma.userEnding.upsert({
            where: { userId_endingId: { userId: auth.userId, endingId: ending.id } },
            create: { userId: auth.userId, endingId: ending.id },
            update: {},
          });
        }
        gameOver = true;
      }
    }

    // Check level up (only if not game over)
    const updatedUser = await prisma.user.findUnique({ where: { id: auth.userId } });
    let leveledUp = false;
    let newLevel = updatedUser?.level || 1;
    let levelRewards = [];

    if (updatedUser && !gameOver && Number(updatedUser.exp) >= newLevel * 500 && newLevel < 50) {
      newLevel = newLevel + 1;
      const expNeeded = newLevel * 500;
      
      // Gold reward for level up
      let levelUpGold = 0;
      if (newLevel <= 10) levelUpGold = 500;
      else if (newLevel <= 20) levelUpGold = 1000;
      else if (newLevel <= 30) levelUpGold = 2000;
      else levelUpGold = 2500;

      // +5 garage health, capped at 100
      const healthGain = Math.min(5, 100 - updatedUser.garageHealth);

      await prisma.user.update({
        where: { id: auth.userId },
        data: {
          level: newLevel,
          exp: { decrement: expNeeded },
          gold: { increment: levelUpGold },
          garageHealth: { increment: healthGain },
        },
      });

      leveledUp = true;

      // Give level rewards
      const rewards = await prisma.levelReward.findMany({
        where: { level: newLevel },
        include: { card: true },
      });

      for (const reward of rewards) {
        await prisma.userInventory.upsert({
          where: { userId_cardId: { userId: auth.userId, cardId: reward.cardId } },
          create: { userId: auth.userId, cardId: reward.cardId, quantity: reward.quantity },
          update: { quantity: { increment: reward.quantity } },
        });
        levelRewards.push({
          name: reward.card.name,
          rarity: reward.card.rarity,
          quantity: reward.quantity,
          cardId: reward.cardId
        });
      }
    }

    return NextResponse.json({
      message: status === 'SUCCESS' ? 'Quest hoàn thành!' : 'Quest thất bại!',
      userState: {
        garageHealth: updatedUser?.garageHealth || 0,
        gold: Number(updatedUser?.gold || 0),
        level: updatedUser?.level || 1,
      },
      rewards: {
        goldReward,
        expReward,
        garageHealthChange,
        budgetProfit: budgetProfit || 0,
      },
      gameOver,
      endingUnlocked,
      leveledUp,
      newLevel,
      levelRewards,
    });

  } catch (error) {
    console.error('Complete quest error:', error);
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}
