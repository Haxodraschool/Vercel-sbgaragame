import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const auth = authenticateRequest(req as any);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { packageId } = body;

    let goldAmount = 0;
    // Tỉ lệ 1$ = 2000 vàng
    switch(packageId) {
        case 'pkg_1': goldAmount = 2000; break;     // 1$
        case 'pkg_5': goldAmount = 10500; break;    // 5$ (bonus 500)
        case 'pkg_10': goldAmount = 22000; break;   // 10$ (bonus 2000)
        case 'pkg_20': goldAmount = 45000; break;   // 20$ (bonus 5000)
        case 'pkg_50': goldAmount = 120000; break;  // 50$ (bonus 20000)
        default: return NextResponse.json({ error: 'Gói nạp không hợp lệ' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: { gold: { increment: goldAmount } },
      select: { gold: true },
    });

    return NextResponse.json({
      message: `Giao dịch thành công! Nhận được ${goldAmount} Vàng.`,
      gold: Number(updatedUser.gold),
    });
  } catch (error: any) {
    console.error('Buy Gold Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
