'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update: updateSession } = useSession();

  const authKey = searchParams.get('authKey');
  const planId = searchParams.get('plan');
  const billingCycle = searchParams.get('billing');

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authKey || !planId) {
      setStatus('error');
      setError('잘못된 접근입니다.');
      return;
    }

    const processBilling = async () => {
      try {
        const response = await fetch('/api/payment/billing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authKey,
            planId,
            billingCycle,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '결제 처리에 실패했습니다.');
        }

        await updateSession();
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    };

    processBilling();
  }, [authKey, planId, billingCycle, updateSession]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <Loader2 size={48} className="animate-spin text-[var(--color-gray-500)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">결제 처리 중</h1>
          <p className="text-gray-600">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">😢</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">결제 실패</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/settings/billing"
            className="inline-block px-6 py-3 bg-[var(--color-gray-900)] text-white font-medium rounded-xl hover:bg-[var(--color-gray-800)]"
          >
            다시 시도하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">결제 완료!</h1>
        <p className="text-gray-600 mb-6">
          Premium 플랜으로 업그레이드되었습니다.<br />
          이제 모든 기능을 사용하실 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[var(--color-gray-900)] text-white font-medium rounded-xl hover:bg-[var(--color-gray-800)]"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <Loader2 size={48} className="animate-spin text-[var(--color-gray-500)] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">로딩 중</h1>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
