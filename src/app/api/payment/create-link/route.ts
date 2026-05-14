import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PayOS } from '@payos/node';

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID!,
  apiKey: process.env.PAYOS_API_KEY!,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
});

// VND packages: price in VND, gold amount, bonus gold
const PACKAGES: Record<string, { amount: number; gold: number; bonus: number; label: string }> = {
  'pkg_10k':  { amount: 10000,  gold: 1000,  bonus: 0,    label: 'Gói Khởi Đầu' },
  'pkg_20k':  { amount: 20000,  gold: 2200,  bonus: 200,  label: 'Gói Thợ Sửa' },
  'pkg_50k':  { amount: 50000,  gold: 6000,  bonus: 1000, label: 'Gói Chuyên Nghiệp' },
  'pkg_100k': { amount: 100000, gold: 13000, bonus: 3000, label: 'Gói Đại Gia' },
  'pkg_200k': { amount: 200000, gold: 28000, bonus: 8000, label: 'Gói Trùm Garage' },
  'pkg_500k': { amount: 500000, gold: 75000, bonus: 25000, label: 'Gói VIP' },
};

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { packageId } = body;

    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: 'Gói nạp không hợp lệ' }, { status: 400 });
    }

    // Generate unique order code (timestamp + random)
    const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);

    // Create payment order in DB
    const order = await prisma.paymentOrder.create({
      data: {
        userId: auth.userId,
        orderCode,
        packageId,
        amount: pkg.amount,
        goldAmount: pkg.gold + pkg.bonus,
        status: 'PENDING',
      },
    });

    // Build return/cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:3000`;
    const returnUrl = `${baseUrl}/payment/result?orderCode=${orderCode}&status=success`;
    const cancelUrl = `${baseUrl}/payment/result?orderCode=${orderCode}&status=cancel`;

    // Create PayOS payment link
    const paymentLink = await payos.paymentRequests.create({
      orderCode,
      amount: pkg.amount,
      description: `Nap ${pkg.gold + pkg.bonus} vang`.substring(0, 25),
      cancelUrl,
      returnUrl,
    });

    // Update order with PayOS info
    await prisma.paymentOrder.update({
      where: { id: order.id },
      data: {
        paymentLinkId: paymentLink.paymentLinkId,
        checkoutUrl: paymentLink.checkoutUrl,
      },
    });

    return NextResponse.json({
      checkoutUrl: paymentLink.checkoutUrl,
      orderCode,
    });
  } catch (error: any) {
    console.error('PayOS Create Link Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi tạo link thanh toán' }, { status: 500 });
  }
}
