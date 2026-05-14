import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const userPayload = authenticateRequest(request as any);
    if (!userPayload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security Check: Only 'admin' accounts can use the dev tool
    if (!userPayload.username.toLowerCase().startsWith('admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { action, value } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: userPayload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedUser;

    switch (action) {
      case 'ADD_GOLD':
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { gold: Number(user.gold) + Number(value) },
        });
        break;
      
      case 'SET_DAY':
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { currentDay: Number(value) },
        });
        // You might want to also clear quests if setting back/forward a day
        await prisma.dailyQuest.deleteMany({
          where: { userId: user.id, status: 'PENDING' }
        });
        break;

      case 'ADD_PRESTIGE':
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { garageHealth: Math.min(100, user.garageHealth + Number(value)) },
        });
        break;

      case 'ADD_LEVEL':
        const levelIncrease = Number(value);
        const newLevel = Math.max(1, user.level + levelIncrease);
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { level: newLevel },
        });
        // Trigger level up rewards similar to end-day logic
        const levelRewards = await prisma.levelReward.findMany({
          where: { level: newLevel },
          include: { card: true },
        });
        for (const reward of levelRewards) {
          await prisma.userInventory.upsert({
            where: { userId_cardId: { userId: user.id, cardId: reward.cardId } },
            create: { userId: user.id, cardId: reward.cardId, quantity: reward.quantity },
            update: { quantity: { increment: reward.quantity } },
          });
        }
        // Add gold reward based on new level
        const levelUpGold = newLevel * newLevel * 100;
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { gold: { increment: levelUpGold } },
        });
        break;

      case 'CLEAR_QUESTS':
        const deletedCount = await prisma.dailyQuest.deleteMany({
          where: { userId: user.id, status: 'PENDING' }
        });
        console.log(`[DEV CHEAT] Cleared ${deletedCount.count} pending quests for user ${user.username}`);
        updatedUser = user;
        break;

      case 'GENERATE_QUESTS':
        // Generate n guests based on 'value'
        const count = Number(value) || 1;
        const questsToCreate = Array.from({ length: count }).map(() => ({
          userId: user.id,
          dayNumber: user.currentDay,
          isBoss: false,
          requiredPower: Math.floor(Math.random() * (user.level * 10)) + 50,
          rewardGold: Math.floor(Math.random() * 50) + 50,
          customerBudget: Math.floor(Math.random() * 100) + 100,
          status: 'PENDING' as const,
        }));
        
        await prisma.dailyQuest.createMany({
          data: questsToCreate
        });
        updatedUser = user;
        break;

      case 'SUMMON_BOSS':
        // Find all available bosses
        const allBosses = await prisma.bossConfig.findMany();
        
        if (allBosses.length === 0) {
          return NextResponse.json({ 
            error: 'Database error: No BossConfigs found. Please run seed script or create BossConfigs first.' 
          }, { status: 400 });
        }

        // Pick one at random (or based on ID if provided in value)
        const bossToSummon = value && typeof value === 'number' 
          ? allBosses.find(b => b.id === value) || allBosses[0]
          : allBosses[Math.floor(Math.random() * allBosses.length)];

        await prisma.dailyQuest.create({
          data: {
            userId: user.id,
            dayNumber: user.currentDay,
            isBoss: true,
            bossConfigId: bossToSummon.id,
            requiredPower: bossToSummon.requiredPower,
            rewardGold: bossToSummon.rewardGold,
            status: 'PENDING' as const,
          }
        });
        updatedUser = user;
        break;

      case 'GIVE_CARDS':
        if (!value || typeof value !== 'object' || !value.targetUsername) {
          return NextResponse.json({ error: 'Missing target username' }, { status: 400 });
        }
        
        const targetUser = await prisma.user.findUnique({ where: { username: value.targetUsername } });
        if (!targetUser) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const qty = value.quantity ? Math.max(1, value.quantity) : 1;
        const targetCard = value.cardId;

        if (targetCard === 'ALL') {
          // Give all cards
          const allCards = await prisma.card.findMany();
          for (const card of allCards) {
            const existing = await prisma.userInventory.findUnique({
              where: { userId_cardId: { userId: targetUser.id, cardId: card.id } }
            });
            if (existing) {
              await prisma.userInventory.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + qty }
              });
            } else {
              await prisma.userInventory.create({
                data: { userId: targetUser.id, cardId: card.id, quantity: qty }
              });
            }
          }
        } else {
          // Give specific card
          const card = await prisma.card.findUnique({ where: { id: targetCard } });
          if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
          
          const existing = await prisma.userInventory.findUnique({
            where: { userId_cardId: { userId: targetUser.id, cardId: card.id } }
          });
          
          if (existing) {
            await prisma.userInventory.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + qty }
            });
          } else {
            await prisma.userInventory.create({
              data: { userId: targetUser.id, cardId: card.id, quantity: qty }
            });
          }
        }
        updatedUser = user; // Current user remains the same
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Convert BigInts before returning
    const safeUser = {
      ...updatedUser,
      gold: Number(updatedUser.gold),
      exp: Number(updatedUser.exp),
      techPoints: Number(updatedUser.techPoints),
      totalShopSpent: Number(updatedUser.totalShopSpent),
    };

    return NextResponse.json({ user: safeUser, message: 'Cheat applied' });

  } catch (error) {
    console.error('Dev Cheat Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
