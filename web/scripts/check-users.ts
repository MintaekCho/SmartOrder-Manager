import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    console.log('All Users:');
    users.forEach(u => {
      console.log(`- ${u.email} | ${u.name} | ${u.role} | ${u.createdAt}`);
    });

    // 카카오 관련 이메일 찾기
    const kakaoUsers = users.filter(u => u.email?.includes('kakao'));
    if (kakaoUsers.length > 0) {
      console.log('\nKakao Users:');
      kakaoUsers.forEach(u => {
        console.log(`- ${u.email} | ${u.name} | ${u.role}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
