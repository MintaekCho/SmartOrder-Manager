import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/coupang';

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  // 농산물 - 과일
  {
    name: '과일',
    slug: 'fruit',
    code: 'FRUIT',
    description: '신선한 제철 과일',
    displayOrder: 1,
    isActive: true,
    isVisible: true,
    icon: '🍎',
    productSeq: 0,
  },
  // 농산물 - 채소
  {
    name: '채소',
    slug: 'vegetable',
    code: 'VEG',
    description: '싱싱한 국내산 채소',
    displayOrder: 2,
    isActive: true,
    isVisible: true,
    icon: '🥬',
    productSeq: 0,
  },
  // 쌀/잡곡
  {
    name: '쌀/잡곡',
    slug: 'rice-grain',
    code: 'RICE',
    description: '국내산 쌀과 잡곡',
    displayOrder: 3,
    isActive: true,
    isVisible: true,
    icon: '🌾',
    productSeq: 0,
  },
  // 수산물
  {
    name: '수산물',
    slug: 'seafood',
    code: 'SEA',
    description: '신선한 해산물',
    displayOrder: 4,
    isActive: true,
    isVisible: true,
    icon: '🐟',
    productSeq: 0,
  },
  // 축산물
  {
    name: '축산물',
    slug: 'meat',
    code: 'MEAT',
    description: '신선한 육류',
    displayOrder: 5,
    isActive: true,
    isVisible: true,
    icon: '🥩',
    productSeq: 0,
  },
  // 유제품/계란
  {
    name: '유제품/계란',
    slug: 'dairy-egg',
    code: 'DAIRY',
    description: '우유, 치즈, 계란 등',
    displayOrder: 6,
    isActive: true,
    isVisible: true,
    icon: '🥛',
    productSeq: 0,
  },
  // 가공식품
  {
    name: '가공식품',
    slug: 'processed-food',
    code: 'PROC',
    description: '반찬, 김치, 장류 등',
    displayOrder: 7,
    isActive: true,
    isVisible: true,
    icon: '🥫',
    productSeq: 0,
  },
  // 건강식품
  {
    name: '건강식품',
    slug: 'health-food',
    code: 'HEALTH',
    description: '건강기능식품, 영양제',
    displayOrder: 8,
    isActive: true,
    isVisible: true,
    icon: '💊',
    productSeq: 0,
  },
];

// 과일 하위 카테고리
const fruitSubCategories = [
  { name: '사과', slug: 'apple', code: 'APPLE', description: '국내산 사과', displayOrder: 1 },
  { name: '배', slug: 'pear', code: 'PEAR', description: '국내산 배', displayOrder: 2 },
  { name: '감귤/오렌지', slug: 'citrus', code: 'CITRUS', description: '감귤류 과일', displayOrder: 3 },
  { name: '포도/샤인머스캣', slug: 'grape', code: 'GRAPE', description: '포도류', displayOrder: 4 },
  { name: '딸기', slug: 'strawberry', code: 'STRWB', description: '딸기', displayOrder: 5 },
  { name: '수박/참외', slug: 'melon', code: 'MELON', description: '수박, 참외, 멜론', displayOrder: 6 },
  { name: '복숭아', slug: 'peach', code: 'PEACH', description: '복숭아', displayOrder: 7 },
  { name: '감/단감', slug: 'persimmon', code: 'PERSM', description: '감류', displayOrder: 8 },
  { name: '기타 과일', slug: 'other-fruit', code: 'FRTETC', description: '기타 과일류', displayOrder: 99 },
];

// 채소 하위 카테고리
const vegetableSubCategories = [
  { name: '배추/양배추', slug: 'cabbage', code: 'CAB', description: '배추, 양배추류', displayOrder: 1 },
  { name: '무/당근', slug: 'radish-carrot', code: 'RADCAR', description: '무, 당근', displayOrder: 2 },
  { name: '오이/호박', slug: 'cucumber-squash', code: 'CUCSQH', description: '오이, 호박류', displayOrder: 3 },
  { name: '토마토', slug: 'tomato', code: 'TOMATO', description: '토마토', displayOrder: 4 },
  { name: '감자/고구마', slug: 'potato-sweetpotato', code: 'POTATO', description: '감자, 고구마', displayOrder: 5 },
  { name: '파/양파/마늘', slug: 'onion-garlic', code: 'ONION', description: '파, 양파, 마늘', displayOrder: 6 },
  { name: '고추/피망', slug: 'pepper', code: 'PEPPER', description: '고추류', displayOrder: 7 },
  { name: '상추/쌈채소', slug: 'lettuce', code: 'LETTUC', description: '상추, 쌈채소', displayOrder: 8 },
  { name: '버섯', slug: 'mushroom', code: 'MUSH', description: '버섯류', displayOrder: 9 },
  { name: '나물/산채', slug: 'herbs', code: 'HERBS', description: '나물, 산채류', displayOrder: 10 },
  { name: '기타 채소', slug: 'other-veg', code: 'VEGETC', description: '기타 채소류', displayOrder: 99 },
];

async function main() {
  console.log('기본 카테고리 생성 시작...');

  // 1. 상위 카테고리 생성
  for (const category of defaultCategories) {
    const existing = await prisma.shopCategory.findUnique({
      where: { slug: category.slug },
    });

    if (existing) {
      console.log(`이미 존재: ${category.name}`);
      continue;
    }

    await prisma.shopCategory.create({
      data: category,
    });
    console.log(`생성 완료: ${category.name}`);
  }

  // 2. 과일 카테고리 ID 조회
  const fruitCategory = await prisma.shopCategory.findUnique({
    where: { slug: 'fruit' },
  });

  if (fruitCategory) {
    for (const sub of fruitSubCategories) {
      const existing = await prisma.shopCategory.findUnique({
        where: { slug: sub.slug },
      });

      if (existing) {
        console.log(`이미 존재: ${sub.name}`);
        continue;
      }

      await prisma.shopCategory.create({
        data: {
          ...sub,
          parentId: fruitCategory.id,
          isActive: true,
          isVisible: true,
          productSeq: 0,
        },
      });
      console.log(`생성 완료: 과일 > ${sub.name}`);
    }
  }

  // 3. 채소 카테고리 ID 조회
  const vegetableCategory = await prisma.shopCategory.findUnique({
    where: { slug: 'vegetable' },
  });

  if (vegetableCategory) {
    for (const sub of vegetableSubCategories) {
      const existing = await prisma.shopCategory.findUnique({
        where: { slug: sub.slug },
      });

      if (existing) {
        console.log(`이미 존재: ${sub.name}`);
        continue;
      }

      await prisma.shopCategory.create({
        data: {
          ...sub,
          parentId: vegetableCategory.id,
          isActive: true,
          isVisible: true,
          productSeq: 0,
        },
      });
      console.log(`생성 완료: 채소 > ${sub.name}`);
    }
  }

  console.log('\n기본 카테고리 생성 완료!');
}

main()
  .catch((e) => {
    console.error('에러 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
