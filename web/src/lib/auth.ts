import { AuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import Kakao from 'next-auth/providers/kakao';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// 세션에 role 추가를 위한 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
  }
}

export const authOptions: AuthOptions = {
  debug: true,
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID || '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] signIn callback:', { user, account: account?.provider, profile });

      try {
        // 로그인 시 사용자가 DB에 없으면 생성
        if (account) {
          // 카카오 ID를 사용해 고유 이메일 생성 (카카오는 이메일이 선택이므로)
          const uniqueEmail = user.email || `kakao_${account.providerAccountId}@kakao.local`;
          console.log('[AUTH] uniqueEmail:', uniqueEmail);
          console.log('[AUTH] user.name:', user.name);

          let existingUser = await prisma.user.findUnique({
            where: { email: uniqueEmail },
          });
          console.log('[AUTH] existingUser by email:', existingUser);

          // 이메일로 못 찾았으면, 같은 이름의 ADMIN 사용자가 있는지 확인
          // (카카오 이메일이 다를 수 있으므로 이름으로 매칭 시도)
          if (!existingUser && user.name) {
            const adminByName = await prisma.user.findFirst({
              where: {
                name: user.name,
                role: 'ADMIN',
              },
            });
            console.log('[AUTH] adminByName:', adminByName);

            if (adminByName) {
              // 기존 ADMIN 사용자의 이메일을 카카오 이메일로 업데이트
              existingUser = await prisma.user.update({
                where: { id: adminByName.id },
                data: {
                  email: uniqueEmail,
                  image: user.image || adminByName.image,
                },
              });
              console.log('[AUTH] Updated existing ADMIN email:', existingUser);
            }
          }

          if (!existingUser) {
            // 첫 번째 사용자인지 확인
            const userCount = await prisma.user.count();
            console.log('[AUTH] userCount:', userCount);

            // 첫 번째 사용자는 ADMIN, 이후는 CUSTOMER
            const newUser = await prisma.user.create({
              data: {
                email: uniqueEmail,
                name: user.name,
                image: user.image,
                role: userCount === 0 ? 'ADMIN' : 'CUSTOMER',
              },
            });
            console.log('[AUTH] newUser created:', newUser);
            existingUser = newUser;
          }

          // 관리자 시스템 접근 권한 확인
          console.log('[AUTH] final user:', existingUser);

          // CUSTOMER는 관리자 시스템 접근 불가
          if (existingUser?.role === 'CUSTOMER') {
            console.log('[AUTH] Access denied - CUSTOMER role');
            return '/auth/error?error=AccessDenied';
          }

          // user 객체에 email 설정 (jwt 콜백에서 사용)
          user.email = uniqueEmail;
        }
        console.log('[AUTH] signIn returning true');
        return true;
      } catch (error) {
        console.error('[AUTH] signIn error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        // DB에서 실제 사용자 정보 조회
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.role = dbUser.role;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log('[AUTH] jwt callback:', { token: { ...token, email: token.email }, user: user?.email, account: account?.provider });
      if (user && account) {
        // 최초 로그인 시 이메일 설정 (카카오는 이메일이 없을 수 있음)
        const uniqueEmail = user.email || `kakao_${account.providerAccountId}@kakao.local`;
        token.email = uniqueEmail;
        token.name = user.name;
        token.picture = user.image;

        // DB에서 사용자 정보 조회
        const dbUser = await prisma.user.findUnique({
          where: { email: uniqueEmail },
        });
        console.log('[AUTH] jwt - dbUser:', dbUser?.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.log('[AUTH] redirect callback:', { url, baseUrl });
      // 같은 origin이면 허용
      if (url.startsWith(baseUrl)) return url;
      // 상대 URL이면 baseUrl에 추가
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
};

// 서버 사이드에서 세션 가져오기
export const getAuthSession = () => getServerSession(authOptions);

// 사용자 ID 가져오기 (없으면 null 반환)
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.user?.id || null;
}

// 현재 사용자의 역할 확인
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getAuthSession();
  return session?.user?.role || null;
}

// 관리자 권한 확인 (ADMIN 또는 STAFF)
export async function isAdminOrStaff(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'ADMIN' || role === 'STAFF';
}

// 관리자 권한만 확인 (ADMIN)
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'ADMIN';
}

// 사용자 ID 가져오기 (없으면 기본 사용자 생성/조회)
export async function getOrCreateDefaultUserId(): Promise<string> {
  const session = await getAuthSession();

  if (session?.user?.id) {
    return session.user.id;
  }

  // 로그인하지 않은 경우 기본 사용자 사용
  const DEFAULT_EMAIL = 'default@system.local';

  let defaultUser = await prisma.user.findUnique({
    where: { email: DEFAULT_EMAIL },
  });

  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        email: DEFAULT_EMAIL,
        name: '시스템 사용자',
        role: 'ADMIN', // 기본 사용자는 ADMIN
      },
    });
  }

  return defaultUser.id;
}

// 사용자의 기본 창고 ID 가져오기 (없으면 생성)
export async function getOrCreateDefaultWarehouseId(userId: string): Promise<string> {
  const DEFAULT_WAREHOUSE_CODE = 'DEFAULT';

  let warehouse = await prisma.warehouse.findFirst({
    where: { userId, code: DEFAULT_WAREHOUSE_CODE },
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        userId,
        name: '기본 창고',
        code: DEFAULT_WAREHOUSE_CODE,
        type: 'MAIN',
        isActive: true,
      },
    });
  }

  return warehouse.id;
}
