import { CoupangClient } from '../src/lib/coupang/client';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    // 환경변수에서 직접 클라이언트 생성
    const client = new CoupangClient({
      accessKey: process.env.COUPANG_ACCESS_KEY!,
      secretKey: process.env.COUPANG_SECRET_KEY!,
    });

    // 대분류 카테고리 조회 (parentCode = 0)
    console.log('=== 대분류 카테고리 (parentCode=0) ===\n');
    const rootCategories = await client.getDisplayCategories(0);

    console.log('API 응답 전체 구조:');
    console.log(JSON.stringify(rootCategories, null, 2).slice(0, 3000));

    // data.child에서 카테고리 목록 추출
    const categories = rootCategories.data?.child || [];

    console.log('\n\n=== 대분류 목록 ===');
    categories.forEach((cat: any, i: number) => {
      const isLeaf = !cat.child || cat.child.length === 0;
      console.log(`${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
    });

    // "식품" 카테고리의 하위 카테고리 조회 (code: 59258)
    const foodCategory = categories.find((c: any) => c.name === '식품');
    if (foodCategory) {
      console.log(`\n\n=== "식품" 하위 카테고리 (code: ${foodCategory.displayItemCategoryCode}) ===`);
      const subCategories = await client.getDisplayCategories(foodCategory.displayItemCategoryCode);

      const subCats = subCategories.data?.child || [];
      subCats.forEach((cat: any, i: number) => {
        const isLeaf = !cat.child || cat.child.length === 0;
        console.log(`  ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
      });

      // 신선식품 카테고리 찾아서 하위 조회
      const freshCategory = subCats.find((c: any) => c.name.includes('신선식품'));
      if (freshCategory) {
        console.log(`\n\n=== "${freshCategory.name}" 하위 카테고리 ===`);
        const freshSubCategories = await client.getDisplayCategories(freshCategory.displayItemCategoryCode);

        const freshSubCats = freshSubCategories.data?.child || [];
        freshSubCats.forEach((cat: any, i: number) => {
          const isLeaf = !cat.child || cat.child.length === 0;
          console.log(`    ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
        });

        // 과일류 하위 카테고리 조회
        const fruitCat = freshSubCats.find((c: any) => c.name.includes('과일'));
        if (fruitCat) {
          console.log(`\n\n=== "${fruitCat.name}" 하위 카테고리 ===`);
          const fruitSubCategories = await client.getDisplayCategories(fruitCat.displayItemCategoryCode);

          const fruitSubCats = fruitSubCategories.data?.child || [];
          fruitSubCats.forEach((cat: any, i: number) => {
            const isLeaf = !cat.child || cat.child.length === 0;
            console.log(`      ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
          });

          // 첫번째 과일 하위 조회 (최하위 확인)
          if (fruitSubCats.length > 0) {
            const firstFruit = fruitSubCats[0];
            console.log(`\n\n=== "${firstFruit.name}" 최하위 확인 ===`);
            const leafCategories = await client.getDisplayCategories(firstFruit.displayItemCategoryCode);

            const leafCats = leafCategories.data?.child || [];
            if (leafCats.length === 0) {
              console.log(`      -> "${firstFruit.name}"이(가) 최하위 카테고리입니다 (isLeaf: true)`);
            } else {
              leafCats.forEach((cat: any, i: number) => {
                const isLeaf = !cat.child || cat.child.length === 0;
                console.log(`        ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
              });
            }
          }

          // 감귤 카테고리 찾기
          const citrusCat = fruitSubCats.find((c: any) => c.name.includes('감귤') || c.name.includes('귤'));
          if (citrusCat) {
            console.log(`\n\n=== "${citrusCat.name}" 최하위 확인 ===`);
            const citrusSubCategories = await client.getDisplayCategories(citrusCat.displayItemCategoryCode);

            const citrusSubCats = citrusSubCategories.data?.child || [];
            if (citrusSubCats.length === 0) {
              console.log(`      -> "${citrusCat.name}"이(가) 최하위 카테고리입니다 (isLeaf: true)`);
              console.log(`      -> 등록 가능 카테고리 코드: ${citrusCat.displayItemCategoryCode}`);
            } else {
              citrusSubCats.forEach((cat: any, i: number) => {
                const isLeaf = !cat.child || cat.child.length === 0;
                console.log(`        ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
              });
            }
          }
        }
      }

      // 과일 카테고리 찾아서 하위 조회
      const fruitCategory = subCats.find((c: any) => c.name.includes('과일'));
      if (fruitCategory) {
        console.log(`\n\n=== "${fruitCategory.name}" 하위 카테고리 ===`);
        const fruitSubCategories = await client.getDisplayCategories(fruitCategory.displayItemCategoryCode);

        const fruitSubCats = fruitSubCategories.data?.child || [];
        fruitSubCats.forEach((cat: any, i: number) => {
          const isLeaf = !cat.child || cat.child.length === 0;
          console.log(`    ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
        });

        // 최하위 카테고리까지 조회
        if (fruitSubCats.length > 0) {
          const firstFruitSub = fruitSubCats[0];
          console.log(`\n\n=== "${firstFruitSub.name}" 최하위 카테고리 ===`);
          const leafCategories = await client.getDisplayCategories(firstFruitSub.displayItemCategoryCode);

          const leafCats = leafCategories.data?.child || [];
          if (leafCats.length === 0) {
            console.log(`    -> "${firstFruitSub.name}"이(가) 최하위 카테고리입니다 (isLeaf: true)`);
          } else {
            leafCats.forEach((cat: any, i: number) => {
              const isLeaf = !cat.child || cat.child.length === 0;
              console.log(`      ${i+1}. ${cat.name} (code: ${cat.displayItemCategoryCode}, isLeaf: ${isLeaf})`);
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('에러:', error);
  }
}

main();
