import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orderCode = req.nextUrl.searchParams.get('orderCode');
    if (!orderCode) {
      return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 });
    }

    const order = await prisma.paymentOrder.findUnique({
      where: { orderCode: BigInt(orderCode) },
      select: {
        id: true,
        orderCode: true,
        packageId: true,
        amount: true,
        goldAmount: true,
        status: true,
        paidAt: true,
        userId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Ensure the order belongs to the authenticated user
    if (order.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If paid, get updated gold balance
    let currentGold: number | null = null;
    if (order.status === 'PAID') {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { gold: true },
      });
      currentGold = user ? Number(user.gold) : null;
    }

    return NextResponse.json({
      orderCode: Number(order.orderCode),
      packageId: order.packageId,
      amount: order.amount,
      goldAmount: order.goldAmount,
      status: order.status,
      paidAt: order.paidAt,
      currentGold,
    });
  } catch (error: any) {
    console.error('Payment Status Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
