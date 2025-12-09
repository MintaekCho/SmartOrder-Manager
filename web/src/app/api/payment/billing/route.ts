import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { issueBillingKey, chargeBilling, generateOrderId } from '@/lib/payment/toss';
import { PLANS } from '@/lib/subscription/plans';

// 빌링키 발급 및 첫 결제
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { authKey, planId, billingCycle } = body;

    if (!authKey || !planId) {
      return NextResponse.json(
        { error: 'authKey and planId are required' },
        { status: 400 }
      );
    }

    // 플랜 확인
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan || plan.price === 0) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // 빌링키 발급
    const billingResult = await issueBillingKey(authKey, subscription.customerKey!);

    // 첫 결제 금액 계산
    const amount = billingCycle === 'yearly' && plan.yearlyPrice
      ? plan.yearlyPrice
      : plan.price;

    // 첫 결제 실행
    const orderId = generateOrderId();
    const orderName = `CoupangAuto ${plan.name} 구독 (${billingCycle === 'yearly' ? '연간' : '월간'})`;

    const paymentResult = await chargeBilling(
      billingResult.billingKey,
      subscription.customerKey!,
      amount,
      orderId,
      orderName
    );

    // 구독 기간 계산
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // 구독 정보 업데이트
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        plan: planId,
        status: 'ACTIVE',
        billingKey: billingResult.billingKey,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // 결제 내역 저장
    await prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        paymentKey: paymentResult.paymentKey,
        orderId,
        amount,
        status: 'PAID',
        method: paymentResult.method,
        cardCompany: billingResult.cardCompany,
        cardNumber: billingResult.cardNumber,
        paidAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        plan: planId,
        periodEnd: periodEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Billing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Billing failed' },
      { status: 500 }
    );
  }
}
