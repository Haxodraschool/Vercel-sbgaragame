// GET /api/admin/stats — Dashboard statistics
import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, unauthorizedResponse } from '@/lib/adminAuth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const admin = await authenticateAdmin(request);
  if (!admin) return unauthorizedResponse();

  try {
    const [
      totalUsers,
      totalAdmins,
      totalCards,
      totalInventoryItems,
      totalQuests,
      successQuests,
      totalBosses,
      totalEvents,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'PLAYER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.card.count(),
      prisma.userInventory.count(),
      prisma.dailyQuest.count(),
      prisma.dailyQuest.count({ where: { status: 'SUCCESS' } }),
      prisma.bossConfig.count(),
      prisma.gameEvent.count(),
      prisma.user.findMany({
        where: { role: 'PLAYER' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          username: true,
          level: true,
          gold: true,
          currentDay: true,
          updatedAt: true,
        },
      }),
    ]);

    // Total gold in circulation - handle potential errors
    let totalGold = 0;
    try {
      const allPlayers = await prisma.user.findMany({
        where: { role: 'PLAYER' },
        select: { gold: true },
      });
      totalGold = allPlayers.reduce((sum, u) => sum + Number(u.gold), 0);
    } catch {
      totalGold = 0;
    }

    // Most popular cards
    let popularCardsResult: Array<{ cardId: number; totalOwned: number; name?: string; rarity?: number; type?: string }> = [];
    try {
      const inventoryItems = await prisma.userInventory.findMany({
        select: { cardId: true, quantity: true },
      });

      // Group and sum manually
      const cardTotals: Record<number, number> = {};
      for (const item of inventoryItems) {
        cardTotals[item.cardId] = (cardTotals[item.cardId] || 0) + item.quantity;
      }

      const sorted = Object.entries(cardTotals)
        .map(([id, total]) => ({ cardId: Number(id), totalOwned: total }))
        .sort((a, b) => b.totalOwned - a.totalOwned)
        .slice(0, 5);

      if (sorted.length > 0) {
        const cardNames = await prisma.card.findMany({
          where: { id: { in: sorted.map((s) => s.cardId) } },
          select: { id: true, name: true, rarity: true, type: true },
        });
        const nameMap = Object.fromEntries(cardNames.map((c) => [c.id, c]));
        popularCardsResult = sorted.map((s) => ({ ...s, ...nameMap[s.cardId] }));
      }
    } catch {
      popularCardsResult = [];
    }

    return NextResponse.json({
      overview: {
        totalPlayers: totalUsers,
        totalAdmins,
        totalCards,
        totalInventoryItems,
        totalGoldInCirculation: totalGold,
        totalQuests,
        successQuests,
        questSuccessRate: totalQuests > 0 ? Math.round((successQuests / totalQuests) * 100) : 0,
        totalBosses,
        totalEvents,
      },
      recentPlayers: recentUsers.map((u) => ({
        ...u,
        gold: Number(u.gold),
      })),
      popularCards: popularCardsResult,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
