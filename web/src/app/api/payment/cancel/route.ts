import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 구독 취소 (다음 결제일부터 취소)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 구독 정보 조회
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.plan === 'FREE') {
      return NextResponse.json({ error: 'Free plan cannot be canceled' }, { status: 400 });
    }

    // 구독 취소 예약 (현재 기간 종료 후 취소)
    await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: '구독이 취소 예약되었습니다. 현재 결제 기간이 종료되면 Free 플랜으로 전환됩니다.',
      periodEnd: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error('[API] Cancel subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cancellation failed' },
      { status: 500 }
    );
  }
}
