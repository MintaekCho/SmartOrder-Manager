/**
 * 도매꾹 상세페이지 - 상세 설명 HTML 영역 확인
 */

import { chromium } from 'playwright';

async function debugDetailPage() {
  console.log('🔍 도매꾹 상세 설명 HTML 분석\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchInput = await page.$('#searchWordForm');
    if (searchInput) {
      await searchInput.fill('의류');  // 의류는 보통 상세 이미지가 많음
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // 3번째 상품 선택 (다양한 상품 테스트)
    const productLinks = await page.evaluate(() => {
      const links: string[] = [];
      document.querySelectorAll('a').forEach((link) => {
        if (link.href.match(/domeggook\.com\/\d{5,}/) && !links.includes(link.href)) {
          links.push(link.href);
        }
      });
      return links.slice(0, 5);
    });

    if (productLinks.length === 0) {
      console.log('상품 링크 없음');
      return;
    }

    // 여러 상품 테스트
    for (let i = 0; i < Math.min(3, productLinks.length); i++) {
      const productLink = productLinks[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📦 [${i + 1}] ${productLink}\n`);

      await page.goto(productLink, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // 스크롤
      for (let j = 0; j < 3; j++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(300);
      }
      await page.evaluate(() => window.scrollTo(0, 0));

      // HTML 구조 분석 - 상세 설명 영역 찾기
      const analysis = await page.evaluate(() => {
        const result: any = {
          productName: '',
          detailAreaFound: false,
          detailAreaSelector: '',
          detailImageCount: 0,
          detailImages: [],
        };

        // 상품명
        const h1 = document.querySelector('h1');
        result.productName = h1?.textContent?.trim() || '';

        // 상세 설명 영역 찾기 - 여러 방법 시도
        const detailSelectors = [
          '#goods_cont',      // 도매꾹 상품 설명
          '.goods_cont',
          '#item_detail',
          '.item_detail',
          '#prd_detail',
          '.prd_detail',
          '#detail_cont',
          '.detail_cont',
          'div[id*="detail"]',
          'div[id*="goods_cont"]',
        ];

        for (const sel of detailSelectors) {
          const el = document.querySelector(sel);
          if (el) {
            const images = el.querySelectorAll('img');
            if (images.length > 0) {
              result.detailAreaFound = true;
              result.detailAreaSelector = sel;
              result.detailImageCount = images.length;

              images.forEach((img) => {
                const src = img.src || img.getAttribute('data-src') || '';
                if (src && result.detailImages.length < 10) {
                  result.detailImages.push(src.substring(0, 100));
                }
              });
              break;
            }
          }
        }

        // 상세 영역을 못 찾으면, 페이지 중간~하단의 큰 이미지들 찾기
        if (!result.detailAreaFound) {
          const seenUrls = new Set<string>();
          const allImages = document.querySelectorAll('img');

          allImages.forEach((img) => {
            const src = img.src || img.getAttribute('data-src') || '';
            if (!src || seenUrls.has(src)) return;
            if (!src.includes('upload')) return;
            if (src.includes('_stt_') || src.includes('_thum')) return; // 썸네일 제외

            const rect = img.getBoundingClientRect();
            const width = img.naturalWidth || img.width;
            const y = rect.top + window.scrollY;

            // 중간 이하 위치의 큰 이미지
            if (y > 600 && width > 300 && result.detailImages.length < 10) {
              seenUrls.add(src);
              result.detailImages.push(src.substring(0, 100));
            }
          });
        }

        return result;
      });

      console.log(`상품명: ${analysis.productName}`);
      console.log(`상세영역 발견: ${analysis.detailAreaFound}`);
      console.log(`상세영역 셀렉터: ${analysis.detailAreaSelector}`);
      console.log(`상세 이미지 수: ${analysis.detailImageCount || analysis.detailImages.length}`);

      if (analysis.detailImages.length > 0) {
        console.log('\n상세 이미지:');
        analysis.detailImages.forEach((src: string, idx: number) => {
          console.log(`  [${idx + 1}] ${src}`);
        });
      }
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDetailPage();
