/**
 * 실제 도매꾹 크롤링 테스트
 * Stealth 모드가 적용된 크롤러 사용
 *
 * 실행: npx tsx scripts/test-real-crawl.ts
 */

import { DomeggookCrawler, closeDomeggookCrawler } from '../src/lib/crawler/domeggook-crawler';

async function testRealCrawl() {
  console.log('🔒 실제 도매꾹 크롤링 테스트\n');
  console.log('=' .repeat(50));

  const crawler = new DomeggookCrawler();

  try {
    // 1. 과일 검색
    console.log('\n📍 Test 1: "과일" 검색');
    const fruitResult = await crawler.search('과일', { maxItems: 10 });

    console.log(`   성공: ${fruitResult.success}`);
    console.log(`   수집 상품: ${fruitResult.items.length}개`);

    if (fruitResult.items.length > 0) {
      console.log('\n   🍎 상품 목록:');
      fruitResult.items.slice(0, 5).forEach((item, i) => {
        console.log(`   [${i + 1}] ${item.name}`);
        console.log(`       가격: ${item.price.toLocaleString()}원`);
        console.log(`       이미지: ${item.thumbnailUrl.substring(0, 50)}...`);
        console.log(`       URL: ${item.url.substring(0, 50)}...`);
      });
    }

    // 2. 채소 검색
    console.log('\n📍 Test 2: "채소" 검색');
    const vegResult = await crawler.search('채소', { maxItems: 5 });

    console.log(`   성공: ${vegResult.success}`);
    console.log(`   수집 상품: ${vegResult.items.length}개`);

    if (vegResult.items.length > 0) {
      vegResult.items.slice(0, 3).forEach((item, i) => {
        console.log(`   [${i + 1}] ${item.name} - ${item.price.toLocaleString()}원`);
      });
    }

    // 3. 상세페이지 크롤링 (첫 번째 상품)
    if (fruitResult.items.length > 0 && fruitResult.items[0].url) {
      console.log('\n📍 Test 3: 상세페이지 크롤링');
      console.log(`   URL: ${fruitResult.items[0].url}`);

      const detailResult = await crawler.crawlProductDetail(fruitResult.items[0].url);

      console.log(`   성공: ${detailResult.success}`);
      console.log(`   상세 이미지: ${detailResult.detailImages.length}개`);

      if (detailResult.detailImages.length > 0) {
        console.log('   이미지 목록:');
        detailResult.detailImages.slice(0, 3).forEach((img, i) => {
          console.log(`   [${i + 1}] ${img.substring(0, 60)}...`);
        });
      }
    }

    console.log('\n✅ 크롤링 테스트 완료!');

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error);
  } finally {
    await crawler.close();
  }
}

// 실행
testRealCrawl();
