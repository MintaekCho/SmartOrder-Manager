'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Check, X, TrendingUp, Zap } from 'lucide-react';
import { PLANS, formatPrice } from '@/lib/subscription/plans';

export default function PricingPage() {
  const { data: session } = useSession();
  const [isYearly, setIsYearly] = useState(false);

  const currentPlan = (session?.user as any)?.subscription?.plan || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <TrendingUp size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">CoupangAuto</span>
          </Link>
          {session ? (
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              대시보드로 이동
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          심플한 요금제, 강력한 기능
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          쿠팡 판매 자동화에 필요한 모든 기능을 하나의 플랜으로
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            월간 결제
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                isYearly ? 'left-8' : 'left-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
            연간 결제
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              20% 할인
            </span>
          </span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {PLANS.map((plan) => {
            const price = isYearly && plan.yearlyPrice
              ? Math.round(plan.yearlyPrice / 12)
              : plan.price;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular
                    ? 'ring-2 ring-blue-600'
                    : 'border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-medium rounded-full flex items-center gap-1">
                    <Zap size={14} />
                    인기
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {price === 0 ? '무료' : `${formatPrice(price)}원`}
                  </span>
                  {price > 0 && (
                    <span className="text-gray-500 ml-1">/월</span>
                  )}
                  {isYearly && plan.yearlyPrice && (
                    <p className="text-sm text-gray-500 mt-1">
                      연 {formatPrice(plan.yearlyPrice)}원 (월 결제 대비 {formatPrice(plan.price * 12 - plan.yearlyPrice)}원 절약)
                    </p>
                  )}
                </div>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-medium rounded-xl cursor-not-allowed"
                  >
                    현재 플랜
                  </button>
                ) : plan.id === 'FREE' ? (
                  <Link
                    href="/auth/signin"
                    className="block w-full py-3 px-4 text-center border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    무료로 시작하기
                  </Link>
                ) : (
                  <Link
                    href={session ? `/settings/billing?plan=${plan.id}&billing=${isYearly ? 'yearly' : 'monthly'}` : '/auth/signin'}
                    className="block w-full py-3 px-4 text-center bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    {session ? '업그레이드' : '시작하기'}
                  </Link>
                )}

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={20} className="text-gray-300 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                        {feature.limit && (
                          <span className="text-gray-500 ml-1">({feature.limit})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            자주 묻는 질문
          </h2>
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">
                언제든지 플랜을 변경할 수 있나요?
              </h3>
              <p className="text-gray-600">
                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다.
                업그레이드 시 즉시 적용되며, 다운그레이드는 현재 결제 주기가 끝난 후 적용됩니다.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">
                환불 정책이 어떻게 되나요?
              </h3>
              <p className="text-gray-600">
                결제 후 7일 이내에 서비스를 사용하지 않았다면 전액 환불이 가능합니다.
                7일 이후에는 남은 기간에 대해 일할 계산하여 환불해 드립니다.
              </p>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">
                무료 플랜에서 Premium으로 업그레이드하면 데이터가 유지되나요?
              </h3>
              <p className="text-gray-600">
                네, 모든 데이터가 그대로 유지됩니다. 업그레이드 시 추가 기능만 활성화됩니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; 2024 CoupangAuto. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-gray-500 text-sm hover:text-gray-700">
              이용약관
            </Link>
            <Link href="/privacy" className="text-gray-500 text-sm hover:text-gray-700">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
