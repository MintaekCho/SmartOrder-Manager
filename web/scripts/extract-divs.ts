/**
 * DIV 기반 상품 추출 테스트
 */

import { chromium } from 'playwright';

async function extractDivs() {
  console.log('🔍 DIV 기반 상품 추출\n');

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
      await searchInput.fill('마스크');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    }

    // DIV 분석
    const products = await page.evaluate(() => {
      const items: any[] = [];

      // 모든 div 중에서 상품처럼 보이는 것 찾기
      const allDivs = document.querySelectorAll('div');

      allDivs.forEach((div, idx) => {
        // 조건: 이미지, 가격, 링크 포함
        const img = div.querySelector('img:not([src*="icon"]):not([src*="logo"]):not([src*="btn"])');
        const text = div.textContent || '';
        const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);
        const link = div.querySelector('a[href*="goods"]');

        // 크기 조건
        const rect = div.getBoundingClientRect();
        const isValidSize = rect.width > 150 && rect.height > 100 && rect.height < 500;

        if (img && priceMatch && link && isValidSize && items.length < 20) {
          // 상품명 추출 시도
          let name = '';

          // a 태그 내 텍스트
          const nameLink = div.querySelector('a[href*="goods"]');
          if (nameLink) {
            name = nameLink.textContent?.trim() || '';
          }

          // 이름이 너무 길거나 짧으면 다른 방식
          if (name.length < 5 || name.length > 100) {
            const spans = div.querySelectorAll('span, strong, b');
            for (const span of spans) {
              const spanText = span.textContent?.trim() || '';
              if (spanText.length > 5 && spanText.length < 80 && !spanText.match(/원|배송|무료/)) {
                name = spanText;
                break;
              }
            }
          }

          // 가격 추출
          const price = priceMatch[1].replace(/,/g, '');

          // 이미지 URL
          const imgSrc = img.getAttribute('src') || img.getAttribute('data-src') || '';

          // 링크 URL
          const href = (link as HTMLAnchorElement).href || '';

          // 중복 체크
          const isDuplicate = items.some((item) => item.href === href);

          if (!isDuplicate && name && parseInt(price) > 100) {
            items.push({
              name: name.substring(0, 80),
              price: parseInt(price),
              imgSrc: imgSrc.substring(0, 100),
              href: href.substring(0, 100),
              divClass: div.className.substring(0, 50),
              size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
            });
          }
        }
      });

      return items;
    });

    console.log(`📦 추출된 상품: ${products.length}개\n`);

    products.forEach((p, i) => {
      console.log(`[${i + 1}] ${p.name}`);
      console.log(`    가격: ${p.price.toLocaleString()}원`);
      console.log(`    이미지: ${p.imgSrc}`);
      console.log(`    링크: ${p.href}`);
      console.log(`    DIV: ${p.divClass} (${p.size})`);
      console.log('');
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

extractDivs();
