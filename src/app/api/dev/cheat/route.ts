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
        updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { level: Math.max(1, user.level + Number(value)) },
        });
        break;

      case 'CLEAR_QUESTS':
        await prisma.dailyQuest.deleteMany({
          where: { userId: user.id, status: 'PENDING' }
        });
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
