'use client';

import { signIn } from 'next-auth/react';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState(false);

  const handleKakaoLogin = async () => {
    setIsLoading(true);
    await signIn('kakao', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">싱이음 관리자</h1>
          <p className="text-gray-500 mt-2">관리자 계정으로 로그인하세요</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {error === 'AccessDenied'
                ? '접근 권한이 없습니다. 관리자 또는 직원 계정만 로그인할 수 있습니다.'
                : error === 'OAuthSignin'
                  ? '로그인 중 오류가 발생했습니다.'
                  : error === 'OAuthCallback'
                    ? '인증 콜백 중 오류가 발생했습니다.'
                    : error === 'OAuthAccountNotLinked'
                      ? '이미 다른 방법으로 가입된 이메일입니다.'
                      : '로그인 중 오류가 발생했습니다.'}
            </p>
          </div>
        )}

        {/* Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            관리자 또는 직원 계정만 로그인할 수 있습니다.
            <br />
            일반 고객은{' '}
            <a
              href="http://localhost:3005"
              className="font-medium underline hover:text-blue-800"
            >
              싱이음몰
            </a>
            을 이용해주세요.
          </p>
        </div>

        {/* Kakao Login Button */}
        <button
          onClick={handleKakaoLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.026 5.934l-.975 3.587c-.086.317.258.582.545.42l4.075-2.417c.76.104 1.544.159 2.329.159 5.523 0 10-3.477 10-7.683C22 6.477 17.523 3 12 3z" />
          </svg>
          {isLoading ? '로그인 중...' : '카카오로 로그인'}
        </button>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            로그인 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
