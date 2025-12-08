/**
 * 수정된 상세페이지 크롤러 테스트
 */

import { getDomeggookCrawler, closeDomeggookCrawler } from '../src/lib/crawler/domeggook-crawler';

async function test() {
  console.log('🧪 상세페이지 크롤러 테스트\n');

  const crawler = getDomeggookCrawler();

  try {
    // 테스트 상품 URL
    const testUrls = [
      'https://domeggook.com/60955298',  // 마스크 상품
      'https://domeggook.com/52792836',  // 크리스마스 블럭 상품
    ];

    for (const url of testUrls) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 테스트: ${url}\n`);

      const result = await crawler.crawlProductDetail(url);

      console.log(`성공: ${result.success}`);
      console.log(`상품명: ${result.productName}`);
      console.log(`상세 이미지 수: ${result.detailImages.length}`);

      if (result.detailImages.length > 0) {
        console.log('\n상세 이미지:');
        result.detailImages.slice(0, 10).forEach((src, idx) => {
          console.log(`  [${idx + 1}] ${src.substring(0, 100)}`);
        });
      }

      if (result.error) {
        console.log(`에러: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('테스트 오류:', error);
  } finally {
    await closeDomeggookCrawler();
  }
}

test();
