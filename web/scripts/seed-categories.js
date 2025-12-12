const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

// dotenv 설정 - .env와 .env.local 둘 다 시도
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

async function createCategories() {
  // PostgreSQL connection pool
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Prisma adapter for pg
  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Connecting to database...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // 최상위 카테고리: 농산물
    const parent = await prisma.shopCategory.create({
      data: {
        name: '농산물',
        slug: 'farm-products',
        code: 'FARM',
        description: '신선한 농산물',
        displayOrder: 0,
        isActive: true,
        isVisible: true,
        productSeq: 0,
      }
    });
    console.log('Created:', parent.name, '- ID:', parent.id);

    // 하위 카테고리들
    const subCategories = [
      { name: '과일', slug: 'fruits', code: 'FRUIT', description: '제철 과일', displayOrder: 1 },
      { name: '채소', slug: 'vegetables', code: 'VEGE', description: '신선한 채소', displayOrder: 2 },
      { name: '쌀/잡곡', slug: 'rice-grains', code: 'RICE', description: '쌀, 잡곡류', displayOrder: 3 },
      { name: '버섯', slug: 'mushrooms', code: 'MUSH', description: '각종 버섯류', displayOrder: 4 },
      { name: '나물/산채', slug: 'herbs', code: 'HERB', description: '나물, 산나물', displayOrder: 5 },
      { name: '견과류', slug: 'nuts', code: 'NUT', description: '견과류', displayOrder: 6 },
    ];

    for (const cat of subCategories) {
      const created = await prisma.shopCategory.create({
        data: {
          ...cat,
          parentId: parent.id,
          isActive: true,
          isVisible: true,
          productSeq: 0,
        }
      });
      console.log('Created:', created.name, '- ID:', created.id);
    }

    console.log('\nDone! All categories created successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

createCategories();
