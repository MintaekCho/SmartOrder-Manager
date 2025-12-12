'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ShieldX } from 'lucide-react';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, { title: string; message: string }> = {
    Configuration: {
      title: '서버 구성 오류',
      message: '서버 구성 오류가 발생했습니다. 관리자에게 문의해주세요.',
    },
    AccessDenied: {
      title: '접근 권한 없음',
      message:
        '관리자 또는 직원 계정만 이용 가능합니다. 일반 고객은 싱이음몰을 이용해주세요.',
    },
    Verification: {
      title: '인증 만료',
      message: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
    },
    OAuthSignin: {
      title: '로그인 오류',
      message: 'OAuth 로그인을 시작하는 중 오류가 발생했습니다.',
    },
    OAuthCallback: {
      title: '인증 콜백 오류',
      message: 'OAuth 콜백 처리 중 오류가 발생했습니다.',
    },
    OAuthCreateAccount: {
      title: '계정 생성 오류',
      message: '계정 생성 중 오류가 발생했습니다.',
    },
    OAuthAccountNotLinked: {
      title: '계정 연결 오류',
      message: '이 이메일은 이미 다른 로그인 방법으로 등록되어 있습니다.',
    },
    SessionRequired: {
      title: '로그인 필요',
      message: '이 페이지에 접근하려면 로그인이 필요합니다.',
    },
    Default: {
      title: '인증 오류',
      message: '알 수 없는 오류가 발생했습니다.',
    },
  };

  const errorInfo = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;
  const isAccessDenied = error === 'AccessDenied';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div
          className={`w-16 h-16 rounded-full ${isAccessDenied ? 'bg-red-50' : 'bg-amber-50'} flex items-center justify-center mx-auto mb-6`}
        >
          {isAccessDenied ? (
            <ShieldX size={32} className="text-red-600" />
          ) : (
            <AlertTriangle size={32} className="text-amber-600" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {errorInfo.title}
        </h1>
        <p className="text-gray-600 mb-8">{errorInfo.message}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            다시 로그인하기
          </Link>
          {isAccessDenied && (
            <a
              href="http://localhost:3005"
              className="block w-full px-4 py-3 bg-[#FEE500] text-[#191919] rounded-xl hover:bg-[#FADA0A] transition-colors font-medium"
            >
              싱이음몰로 이동
            </a>
          )}
          <Link
            href="/"
            className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
