import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 인증이 필요하지 않은 경로
const publicPaths = [
  '/auth/signin',
  '/auth/error',
  '/api/auth',
  '/api/public',
  '/pricing',
  '/terms',
  '/privacy',
  '/test',
];

// Premium 플랜이 필요한 경로
const premiumPaths = [
  '/sourcing/trends',
  '/products/detail-editor',
  '/tools/ai-thumbnail',
  '/reports',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일 및 API는 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Public 경로는 인증 없이 접근 가능
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 토큰 확인 (NextAuth는 NEXTAUTH_SECRET 사용)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Premium 경로 접근 시 플랜 확인 (API에서 처리하도록 헤더 추가)
  if (premiumPaths.some((path) => pathname.startsWith(path))) {
    const response = NextResponse.next();
    response.headers.set('x-user-id', token.sub || '');
    response.headers.set('x-requires-premium', 'true');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
