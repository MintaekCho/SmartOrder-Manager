'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  CreditCard,
  Check,
  AlertCircle,
  Calendar,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { PLANS, formatPrice, getPlan } from '@/lib/subscription/plans';

function BillingContent() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedPlanId = searchParams.get('plan') || 'PREMIUM';
  const billingCycle = searchParams.get('billing') || 'monthly';

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const currentSubscription = (session?.user as any)?.subscription;
  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);
  const currentPlan = currentSubscription ? getPlan(currentSubscription.plan) : null;

  const isUpgrade = selectedPlanId !== currentSubscription?.plan;

  // 토스페이먼츠 SDK 로드
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.TossPayments) {
      const script = document.createElement('script');
      script.src = 'https://js.tosspayments.com/v1/payment';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = async () => {
    if (!selectedPlan || selectedPlan.price === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error('결제 설정이 완료되지 않았습니다.');
      }

      const tossPayments = (window as any).TossPayments(clientKey);

      // 결제 금액 계산
      const amount = billingCycle === 'yearly' && selectedPlan.yearlyPrice
        ? selectedPlan.yearlyPrice
        : selectedPlan.price;

      // 빌링키 발급을 위한 카드 등록
      await tossPayments.requestBillingAuth('카드', {
        customerKey: `cust_${session?.user?.id}`,
        successUrl: `${window.location.origin}/settings/billing/success?plan=${selectedPlanId}&billing=${billingCycle}`,
        failUrl: `${window.location.origin}/settings/billing/fail`,
      });
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '결제 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('정말 구독을 취소하시겠습니까? 현재 결제 기간이 종료되면 Free 플랜으로 전환됩니다.')) {
      return;
    }

    setIsCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/cancel', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '구독 취소에 실패했습니다.');
      }

      alert(data.message);
      await updateSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          설정으로 돌아가기
        </Link>

        {/* Current Plan Info */}
        {currentPlan && !isUpgrade && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">현재 구독</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{currentPlan.name}</p>
                <p className="text-gray-600">
                  {currentPlan.price === 0 ? '무료' : `월 ${formatPrice(currentPlan.price)}원`}
                </p>
                {currentSubscription?.currentPeriodEnd && (
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                    <Calendar size={14} />
                    다음 결제일: {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString('ko-KR')}
                  </p>
                )}
                {currentSubscription?.cancelAtPeriodEnd && (
                  <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={14} />
                    구독 취소 예정 (현재 기간 종료 후)
                  </p>
                )}
              </div>
              {currentPlan.id !== 'FREE' && !currentSubscription?.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancel}
                  disabled={isCanceling}
                  className="px-4 py-2 text-sm text-[var(--color-gray-600)] border border-[var(--color-gray-300)] rounded-lg hover:bg-[var(--color-gray-50)] disabled:opacity-50"
                >
                  {isCanceling ? '처리 중...' : '구독 취소'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Card */}
        {isUpgrade && selectedPlan && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">구독 업그레이드</h2>
              <p className="text-gray-600 mt-1">
                {selectedPlan.name} 플랜으로 업그레이드합니다
              </p>
            </div>

            <div className="p-6">
              {/* Plan Summary */}
              <div className="bg-[var(--color-gray-50)] rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-gray-900">{selectedPlan.name} 플랜</span>
                  <span className="text-lg font-bold text-gray-900">
                    {billingCycle === 'yearly' && selectedPlan.yearlyPrice
                      ? `${formatPrice(selectedPlan.yearlyPrice)}원/년`
                      : `${formatPrice(selectedPlan.price)}원/월`}
                  </span>
                </div>
                {billingCycle === 'yearly' && selectedPlan.yearlyPrice && (
                  <p className="text-sm text-emerald-600">
                    월 결제 대비 {formatPrice(selectedPlan.price * 12 - selectedPlan.yearlyPrice)}원 절약
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">포함된 기능</h3>
                <ul className="space-y-2">
                  {selectedPlan.features
                    .filter((f) => f.included)
                    .map((feature) => (
                      <li key={feature.name} className="flex items-center gap-2 text-sm text-gray-700">
                        <Check size={16} className="text-emerald-600" />
                        {feature.name}
                        {feature.limit && (
                          <span className="text-gray-500">({feature.limit})</span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-sm text-amber-600">{error}</p>
                </div>
              )}

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[var(--color-gray-900)] text-white font-medium rounded-xl hover:bg-[var(--color-gray-800)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                {isLoading ? '처리 중...' : '카드 등록 및 결제하기'}
              </button>

              {/* Security Notice */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield size={16} />
                <span>토스페이먼츠를 통한 안전한 결제</span>
              </div>
            </div>
          </div>
        )}

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm mt-8 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">결제 내역</h2>
          <div className="text-center py-8 text-gray-500">
            결제 내역이 없습니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>로딩 중...</p>
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}

// TypeScript declaration for TossPayments
declare global {
  interface Window {
    TossPayments: any;
  }
}
