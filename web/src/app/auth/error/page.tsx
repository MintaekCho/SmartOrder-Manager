'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: '서버 구성 오류가 발생했습니다.',
    AccessDenied: '접근이 거부되었습니다.',
    Verification: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
    OAuthSignin: 'OAuth 로그인을 시작하는 중 오류가 발생했습니다.',
    OAuthCallback: 'OAuth 콜백 처리 중 오류가 발생했습니다.',
    OAuthCreateAccount: '계정 생성 중 오류가 발생했습니다.',
    EmailCreateAccount: '이메일 계정 생성 중 오류가 발생했습니다.',
    Callback: '콜백 처리 중 오류가 발생했습니다.',
    OAuthAccountNotLinked: '이 이메일은 이미 다른 로그인 방법으로 등록되어 있습니다.',
    EmailSignin: '이메일 전송 중 오류가 발생했습니다.',
    CredentialsSignin: '로그인 정보가 올바르지 않습니다.',
    SessionRequired: '이 페이지에 접근하려면 로그인이 필요합니다.',
    Default: '알 수 없는 오류가 발생했습니다.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">인증 오류</h1>
        <p className="text-gray-600 mb-8">{message}</p>

        <div className="space-y-3">
          <Link
            href="/auth/signin"
            className="block w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            다시 로그인하기
          </Link>
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
