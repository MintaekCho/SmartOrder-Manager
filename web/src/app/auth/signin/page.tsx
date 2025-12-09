'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CoupangAuto</h1>
          <p className="text-gray-500 mt-2">쿠팡 판매 자동화 솔루션</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {error === 'OAuthSignin' && '로그인 중 오류가 발생했습니다.'}
              {error === 'OAuthCallback' && '인증 콜백 중 오류가 발생했습니다.'}
              {error === 'OAuthAccountNotLinked' && '이미 다른 방법으로 가입된 이메일입니다.'}
              {error === 'AccessDenied' && '접근이 거부되었습니다.'}
              {!['OAuthSignin', 'OAuthCallback', 'OAuthAccountNotLinked', 'AccessDenied'].includes(error) && '로그인 중 오류가 발생했습니다.'}
            </p>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={() => handleSignIn('google')}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">
              {isLoading === 'google' ? '로그인 중...' : 'Google로 계속하기'}
            </span>
          </button>

          {/* Naver */}
          <button
            onClick={() => handleSignIn('naver')}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#03C75A] text-white rounded-xl hover:bg-[#02b351] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
            </svg>
            <span className="font-medium">
              {isLoading === 'naver' ? '로그인 중...' : '네이버로 계속하기'}
            </span>
          </button>

          {/* Kakao */}
          <button
            onClick={() => handleSignIn('kakao')}
            disabled={isLoading !== null}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FEE500] text-[#000000] rounded-xl hover:bg-[#fdd800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
            </svg>
            <span className="font-medium">
              {isLoading === 'kakao' ? '로그인 중...' : '카카오로 계속하기'}
            </span>
          </button>
        </div>

        {/* Terms */}
        <p className="mt-8 text-center text-xs text-gray-500">
          로그인함으로써{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            이용약관
          </a>
          과{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            개인정보처리방침
          </a>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}
