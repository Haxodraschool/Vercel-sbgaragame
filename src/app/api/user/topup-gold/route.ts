import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { packageId } = body;

    // Package definitions (mock payment - in real app, this would integrate with payment gateway)
    const packages: Record<string, { gold: number; price: number }> = {
      'pkg_1': { gold: 1000, price: 10000 },    // 10k VND = 1000 gold
      'pkg_2': { gold: 5000, price: 45000 },    // 45k VND = 5000 gold (10% bonus)
      'pkg_3': { gold: 12000, price: 100000 },  // 100k VND = 12000 gold (20% bonus)
      'pkg_4': { gold: 30000, price: 200000 },  // 200k VND = 30000 gold (50% bonus)
      'pkg_5': { gold: 80000, price: 500000 },   // 500k VND = 80000 gold (60% bonus)
    };

    const pkg = packages[packageId];
    if (!pkg) {
      return NextResponse.json({ error: 'Gói nạp không hợp lệ' }, { status: 400 });
    }

    // In a real app, verify payment here before adding gold
    // For now, we'll just add the gold (mock successful payment)
    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        gold: { increment: pkg.gold },
      },
      select: { gold: true },
    });

    return NextResponse.json({
      message: `Nạp thành công ${pkg.gold.toLocaleString()} Gold!`,
      gold: Number(updatedUser.gold),
      package: pkg,
    });

  } catch (error: any) {
    console.error('Topup Gold Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
