/**
 * 크롤링 테스트 스크립트
 * 네이버 쇼핑에서 상품 정보를 크롤링합니다.
 *
 * 실행 방법:
 * npx tsx scripts/test-crawl.ts
 */

import { chromium } from 'playwright';

async function testNaverShoppingCrawl() {
  console.log('🚀 네이버 쇼핑 크롤링 테스트 시작...\n');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    // 네이버 쇼핑 검색
    const searchKeyword = '제주 감귤';
    const searchUrl = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(searchKeyword)}`;

    console.log(`📍 검색 URL: ${searchUrl}`);
    console.log('⏳ 페이지 로딩 중...\n');

    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 페이지 타이틀 확인
    const title = await page.title();
    console.log(`📄 페이지 타이틀: ${title}`);

    // 스크린샷 저장
    await page.screenshot({ path: 'test-naver-search.png', fullPage: false });
    console.log('📸 스크린샷 저장: test-naver-search.png\n');

    // 상품 목록 추출
    console.log('🔍 상품 목록 추출 중...');

    // 잠시 대기 (동적 로딩)
    await page.waitForTimeout(2000);

    const products = await page.evaluate(() => {
      const items: any[] = [];

      // 네이버 쇼핑 상품 아이템
      const productElements = document.querySelectorAll('.product_item__MDtDF, .basicList_item__0T9JD, [class*="product_item"]');

      productElements.forEach((el, index) => {
        if (index >= 5) return; // 최대 5개

        const titleEl = el.querySelector('.product_title__Mmw2K, [class*="title"], .basicList_title__VfX3c, a');
        const priceEl = el.querySelector('.price_num__S2p_v, [class*="price"], .price_price__LEGN7');
        const imgEl = el.querySelector('img');
        const linkEl = el.querySelector('a');
        const mallEl = el.querySelector('.product_mall_title__9Qb1S, [class*="mall"]');

        items.push({
          name: titleEl?.textContent?.trim().substring(0, 50) || '',
          price: priceEl?.textContent?.trim() || '',
          image: imgEl?.src || '',
          link: linkEl?.href || '',
          mall: mallEl?.textContent?.trim() || '',
        });
      });

      return {
        items,
        totalFound: productElements.length,
      };
    });

    console.log(`\n✅ 발견된 상품 수: ${products.totalFound}\n`);

    if (products.items.length > 0) {
      console.log('📦 상품 목록:');
      products.items.forEach((item: any, i: number) => {
        console.log(`\n[${i + 1}] ${item.name || '(이름 없음)'}`);
        console.log(`   가격: ${item.price || '(가격 없음)'}`);
        console.log(`   판매처: ${item.mall || '(정보 없음)'}`);
        console.log(`   이미지: ${item.image?.substring(0, 60) || '(없음)'}...`);
      });

      // 첫 번째 상품 상세페이지 테스트
      if (products.items[0].link) {
        console.log('\n\n🔗 상세페이지 크롤링 테스트...');
        const detailUrl = products.items[0].link;
        console.log(`📍 URL: ${detailUrl.substring(0, 80)}...`);

        await page.goto(detailUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });

        await page.waitForTimeout(2000);

        // 상세페이지 스크린샷
        await page.screenshot({ path: 'test-naver-detail.png', fullPage: false });
        console.log('📸 상세페이지 스크린샷: test-naver-detail.png');

        // 상세 이미지 추출 시도
        const detailImages = await page.evaluate(() => {
          const images: string[] = [];

          // 상품 상세 이미지들
          document.querySelectorAll('img').forEach((img) => {
            const src = img.src;
            if (src &&
                (src.includes('shop') || src.includes('product') || src.includes('detail')) &&
                !src.includes('icon') && !src.includes('logo') &&
                img.width > 200) {
              images.push(src);
            }
          });

          return images.slice(0, 5);
        });

        console.log(`\n📷 상세 이미지 ${detailImages.length}개 발견`);
        detailImages.forEach((img, i) => {
          console.log(`   [${i + 1}] ${img.substring(0, 70)}...`);
        });
      }
    } else {
      console.log('⚠️ 상품을 찾지 못했습니다.');

      // 페이지 구조 확인
      const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('\n📝 페이지 텍스트 미리보기:');
      console.log(bodyText);
    }

  } catch (error) {
    console.error('❌ 크롤링 오류:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 테스트 완료');
  }
}

// 실행
testNaverShoppingCrawl();
