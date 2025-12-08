/**
 * headless vs headful 비교
 */

import { chromium } from 'playwright';

async function compareMode(headless: boolean) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🔍 모드: ${headless ? 'HEADLESS' : 'HEADFUL'}`);
  console.log('='.repeat(50));

  const browser = await chromium.launch({
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  });

  const page = await context.newPage();

  // Stealth 설정
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko'] });
  });

  try {
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 검색
    const searchInput = await page.$('#searchWordForm');
    if (searchInput) {
      await searchInput.fill('마스크');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(4000);
    }

    const url = page.url();
    console.log(`URL: ${url}`);

    // 스크린샷
    const screenshotName = headless ? 'compare-headless.png' : 'compare-headful.png';
    await page.screenshot({ path: screenshotName });
    console.log(`스크린샷: ${screenshotName}`);

    // 분석
    const analysis = await page.evaluate(() => {
      return {
        title: document.title,
        bodyLength: document.body.innerHTML.length,
        imgCount: document.querySelectorAll('img').length,
        tableCount: document.querySelectorAll('table').length,
        trCount: document.querySelectorAll('tr').length,
        divCount: document.querySelectorAll('div').length,
        // 가격이 포함된 요소
        priceElements: Array.from(document.querySelectorAll('*'))
          .filter((el) => el.textContent?.match(/\d{1,3}(,\d{3})*원/))
          .length,
        // 특정 클래스
        goodsList: document.querySelectorAll('.goods_list, .item_list, .product_list').length,
        // 본문 샘플
        bodySample: document.body.innerText.substring(0, 300).replace(/\s+/g, ' '),
      };
    });

    console.log(`\n분석 결과:`);
    console.log(`  타이틀: ${analysis.title}`);
    console.log(`  HTML 길이: ${analysis.bodyLength}`);
    console.log(`  이미지: ${analysis.imgCount}개`);
    console.log(`  테이블: ${analysis.tableCount}개`);
    console.log(`  TR: ${analysis.trCount}개`);
    console.log(`  DIV: ${analysis.divCount}개`);
    console.log(`  가격 요소: ${analysis.priceElements}개`);
    console.log(`  상품목록 클래스: ${analysis.goodsList}개`);
    console.log(`  본문 샘플: ${analysis.bodySample.substring(0, 150)}...`);

    if (!headless) {
      console.log('\n5초 후 종료...');
      await page.waitForTimeout(5000);
    }
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

async function main() {
  // Headless 먼저
  await compareMode(true);

  // Headful
  await compareMode(false);
}

main();
