import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 토스페이먼츠 웹훅 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    console.log('[Webhook] Received:', eventType, data);

    switch (eventType) {
      case 'PAYMENT_STATUS_CHANGED': {
        // 결제 상태 변경 처리
        const { paymentKey, status } = data;

        const payment = await prisma.payment.findUnique({
          where: { paymentKey },
        });

        if (payment) {
          await prisma.payment.update({
            where: { paymentKey },
            data: {
              status: status === 'DONE' ? 'PAID' :
                      status === 'CANCELED' ? 'CANCELED' :
                      status === 'EXPIRED' ? 'FAILED' : payment.status,
            },
          });
        }
        break;
      }

      case 'BILLING_PAYMENT_FAILED': {
        // 자동결제 실패 처리
        const { billingKey, failReason } = data;

        const subscription = await prisma.subscription.findFirst({
          where: { billingKey },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'PAST_DUE',
            },
          });
        }
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', eventType);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
