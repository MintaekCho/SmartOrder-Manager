import NextAuth from 'next-auth';
import { authConfig } from './config';

// Prisma adapter is optional - skip for now to fix auth errors
const nextAuth = NextAuth({
  ...authConfig,
  // Skip database adapter to avoid Prisma initialization issues
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export const { handlers, auth, signIn, signOut } = nextAuth;
