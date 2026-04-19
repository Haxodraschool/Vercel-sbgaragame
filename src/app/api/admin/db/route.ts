// POST /api/admin/db — Database management (backup/restore/reseed)
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'backup': {
        const [users, cards, cardEffects, cardCombos, bossConfigs, gameEvents, endings, questConfigs, levelRewards, achievements, starterPerks] = await Promise.all([
          prisma.user.findMany({ include: { inventory: true, achievements: true, endings: true } }),
          prisma.card.findMany(),
          prisma.cardEffect.findMany(),
          prisma.cardCombo.findMany(),
          prisma.bossConfig.findMany(),
          prisma.gameEvent.findMany(),
          prisma.ending.findMany(),
          prisma.questConfig.findMany(),
          prisma.levelReward.findMany(),
          prisma.achievement.findMany(),
          prisma.starterPerk.findMany(),
        ]);

        // Serialize BigInts
        const serializedUsers = users.map((u) => ({
          ...u,
          gold: Number(u.gold),
          exp: Number(u.exp),
          techPoints: Number(u.techPoints),
          totalShopSpent: Number(u.totalShopSpent),
        }));

        return NextResponse.json({
          backup: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            createdBy: admin.username,
            data: {
              users: serializedUsers,
              cards,
              cardEffects,
              cardCombos,
              bossConfigs,
              gameEvents,
              endings,
              questConfigs,
              levelRewards,
              achievements,
              starterPerks,
            },
          },
        });
      }

      case 'restore': {
        if (!data) {
          return NextResponse.json({ error: 'No backup data provided' }, { status: 400 });
        }

        // Restore cards and system data only (not user data, for safety)
        const bd = data;

        // Delete existing system data
        await prisma.cardEffect.deleteMany();
        await prisma.cardCombo.deleteMany();
        await prisma.levelReward.deleteMany();

        // Restore cards
        if (bd.cards?.length) {
          for (const card of bd.cards) {
            await prisma.card.upsert({
              where: { id: card.id },
              create: card,
              update: card,
            });
          }
        }

        // Restore effects
        if (bd.cardEffects?.length) {
          await prisma.cardEffect.createMany({ data: bd.cardEffects, skipDuplicates: true });
        }

        // Restore combos
        if (bd.cardCombos?.length) {
          await prisma.cardCombo.createMany({ data: bd.cardCombos, skipDuplicates: true });
        }

        return NextResponse.json({ message: 'Khôi phục dữ liệu thành công (cards + effects + combos)' });
      }

      default:
        return NextResponse.json({ error: 'Invalid action. Use: backup, restore' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin DB error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
