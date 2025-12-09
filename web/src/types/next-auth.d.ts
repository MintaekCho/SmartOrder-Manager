import { DefaultSession, DefaultUser } from 'next-auth';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      subscription?: {
        plan: SubscriptionPlan;
        status: SubscriptionStatus;
        currentPeriodEnd: Date | null;
      };
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    provider?: string;
  }
}
