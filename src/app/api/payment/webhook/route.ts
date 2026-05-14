import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PayOS } from '@payos/node';

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

// PayOS validates webhook by sending GET request first
export async function GET() {
  return NextResponse.json({ message: 'OK' });
}

export async function POST(req: NextRequest) {
  try {
    // Log raw body for debugging
    const rawText = await req.text();
    console.log('PayOS Webhook RAW:', rawText);
    console.log('PayOS Webhook Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

    if (!rawText || rawText.trim() === '') {
      console.log('PayOS Webhook: Empty body, returning 200');
      return NextResponse.json({ message: 'OK' });
    }

    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch (parseErr) {
      console.log('PayOS Webhook: Non-JSON body, returning 200');
      return NextResponse.json({ message: 'OK' });
    }

    // PayOS webhook validation request (when registering webhook URL)
    if (!body || !body.data || !body.signature) {
      console.log('PayOS Webhook: Validation request, returning 200');
      return NextResponse.json({ message: 'OK' });
    }

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
      // PayOS test webhook uses fake orderCode (e.g. 123) to validate endpoint
      console.log('PayOS Webhook: Order not found (likely test webhook):', orderCode);
      return NextResponse.json({ message: 'OK' });
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
