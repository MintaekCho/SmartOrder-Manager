import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from './config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // 로그인 시 구독 정보가 없으면 Free 플랜으로 자동 생성
      if (user.id) {
        const existingSubscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
        });

        if (!existingSubscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: 'FREE',
              status: 'ACTIVE',
              customerKey: `cust_${user.id}`,
            },
          });
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;

        // 구독 정보 추가
        const subscription = await prisma.subscription.findUnique({
          where: { userId: token.sub },
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        });

        if (subscription) {
          (session.user as any).subscription = subscription;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // 새 사용자 생성 시 Free 플랜 구독 자동 생성
      if (user.id) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            customerKey: `cust_${user.id}`,
          },
        });
      }
    },
  },
});
