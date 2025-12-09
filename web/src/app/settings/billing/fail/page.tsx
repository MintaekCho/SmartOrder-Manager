'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

function FailContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <XCircle size={40} className="text-red-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">결제 실패</h1>
        <p className="text-gray-600 mb-2">
          {errorMessage || '결제 처리 중 오류가 발생했습니다.'}
        </p>
        {errorCode && (
          <p className="text-sm text-gray-500 mb-6">오류 코드: {errorCode}</p>
        )}
        <div className="space-y-3">
          <Link
            href="/settings/billing?plan=PREMIUM"
            className="block w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700"
          >
            다시 시도하기
          </Link>
          <Link
            href="/"
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>로딩 중...</p>
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}
