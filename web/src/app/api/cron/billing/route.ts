import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chargeBilling, generateOrderId } from '@/lib/payment/toss';
import { PLANS } from '@/lib/subscription/plans';

// Vercel Cron 또는 외부 크론에서 호출
// 매일 자정에 실행하여 구독 갱신 처리
export async function GET(request: NextRequest) {
  try {
    // Cron 인증 확인 (Vercel Cron은 자동으로 인증됨)
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // 1. 만료된 구독 처리 (취소 예약된 구독)
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: {
          lte: now,
        },
        status: 'ACTIVE',
      },
    });

    for (const subscription of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: 'FREE',
          status: 'CANCELED',
          billingKey: null,
        },
      });
    }

    // 2. 자동 갱신 처리
    const renewableSubscriptions = await prisma.subscription.findMany({
      where: {
        cancelAtPeriodEnd: false,
        currentPeriodEnd: {
          lte: now,
        },
        status: 'ACTIVE',
        plan: 'PREMIUM',
        billingKey: {
          not: null,
        },
      },
    });

    const results = {
      expired: expiredSubscriptions.length,
      renewed: 0,
      failed: 0,
    };

    for (const subscription of renewableSubscriptions) {
      try {
        const plan = PLANS.find((p) => p.id === subscription.plan);
        if (!plan || !subscription.billingKey || !subscription.customerKey) {
          continue;
        }

        const orderId = generateOrderId();
        const orderName = `CoupangAuto ${plan.name} 구독 갱신`;

        // 자동 결제 실행
        const paymentResult = await chargeBilling(
          subscription.billingKey,
          subscription.customerKey,
          plan.price,
          orderId,
          orderName
        );

        // 구독 기간 갱신
        const newPeriodEnd = new Date(now);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: now,
            currentPeriodEnd: newPeriodEnd,
          },
        });

        // 결제 내역 저장
        await prisma.payment.create({
          data: {
            subscriptionId: subscription.id,
            paymentKey: paymentResult.paymentKey,
            orderId,
            amount: plan.price,
            status: 'PAID',
            method: paymentResult.method,
            paidAt: new Date(),
          },
        });

        results.renewed++;
      } catch (error) {
        console.error(`[Cron] Billing failed for subscription ${subscription.id}:`, error);

        // 결제 실패 처리
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'PAST_DUE',
          },
        });

        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Billing cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
