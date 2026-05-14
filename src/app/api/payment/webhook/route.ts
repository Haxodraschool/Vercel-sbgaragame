import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PayOS } from '@payos/node';

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify webhook signature using PayOS SDK
    let verifiedData;
    try {
      verifiedData = await payos.webhooks.verify(body);
    } catch (verifyError) {
      console.error('PayOS Webhook Signature Invalid:', verifyError);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const { orderCode, amount } = verifiedData;

    // Find the payment order
    const order = await prisma.paymentOrder.findUnique({
      where: { orderCode: BigInt(orderCode) },
    });

    if (!order) {
      console.error('PayOS Webhook: Order not found:', orderCode);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Skip if already paid (idempotent)
    if (order.status === 'PAID') {
      return NextResponse.json({ message: 'Already processed' });
    }

    // Verify amount matches
    if (amount !== order.amount) {
      console.error('PayOS Webhook: Amount mismatch', { expected: order.amount, received: amount });
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // Update order status and credit gold in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: { gold: { increment: order.goldAmount } },
      });
    });

    console.log(`PayOS: Credited ${order.goldAmount} gold to user ${order.userId} for order ${orderCode}`);

    return NextResponse.json({ message: 'OK' });
  } catch (error: any) {
    console.error('PayOS Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
