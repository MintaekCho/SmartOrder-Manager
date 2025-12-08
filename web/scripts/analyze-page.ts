/**
 * 도매꾹 검색 결과 페이지 분석
 */

import { chromium } from 'playwright';

async function analyzePage() {
  console.log('🔍 도매꾹 검색 결과 분석\n');

  const browser = await chromium.launch({
    headless: false,
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
    // 메인 → 검색
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchInput = await page.$('#searchWordForm');
    if (searchInput) {
      await searchInput.fill('마스크');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    }

    console.log('현재 URL:', page.url());

    // 스크린샷
    await page.screenshot({ path: 'analyze-result.png', fullPage: true });
    console.log('스크린샷: analyze-result.png');

    // 페이지 분석
    const analysis = await page.evaluate(() => {
      const result: any = {
        title: document.title,
        bodyLength: document.body.innerHTML.length,
        itemClasses: [],
        potentialProducts: [],
      };

      // 아이템 관련 클래스 찾기
      document.querySelectorAll('*').forEach((el) => {
        const classes = Array.from(el.classList);
        classes.forEach((cls) => {
          if (
            (cls.includes('item') || cls.includes('goods') || cls.includes('product') || cls.includes('list')) &&
            !result.itemClasses.includes(cls)
          ) {
            const count = document.querySelectorAll(`.${cls}`).length;
            result.itemClasses.push({ class: cls, count });
          }
        });
      });

      // 이미지 + 가격 조합 찾기
      const containers = document.querySelectorAll('li, div, article, section');
      containers.forEach((el, idx) => {
        if (idx > 100 || result.potentialProducts.length > 20) return;

        const img = el.querySelector('img');
        const text = el.textContent || '';
        const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);
        const link = el.querySelector('a');

        if (img && priceMatch && link && el.clientHeight > 50 && el.clientWidth > 100) {
          result.potentialProducts.push({
            tag: el.tagName,
            className: el.className.substring(0, 80),
            imgSrc: (img.src || img.getAttribute('data-src') || '').substring(0, 100),
            price: priceMatch[1],
            href: (link.href || '').substring(0, 100),
            text: text.substring(0, 150).replace(/\s+/g, ' ').trim(),
            size: `${el.clientWidth}x${el.clientHeight}`,
          });
        }
      });

      // 정렬: 크기가 큰 순
      result.potentialProducts.sort((a: any, b: any) => {
        const [aw, ah] = a.size.split('x').map(Number);
        const [bw, bh] = b.size.split('x').map(Number);
        return bw * bh - aw * ah;
      });

      return result;
    });

    console.log('\n📊 분석 결과:');
    console.log(`타이틀: ${analysis.title}`);
    console.log(`HTML 길이: ${analysis.bodyLength}`);

    console.log('\n📋 아이템 관련 클래스 (상위 20개):');
    analysis.itemClasses
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 20)
      .forEach((item: any) => {
        console.log(`  .${item.class}: ${item.count}개`);
      });

    console.log(`\n📦 잠재 상품 요소: ${analysis.potentialProducts.length}개`);
    analysis.potentialProducts.slice(0, 10).forEach((p: any, i: number) => {
      console.log(`\n[${i + 1}] <${p.tag}> class="${p.className}"`);
      console.log(`    크기: ${p.size}`);
      console.log(`    가격: ${p.price}원`);
      console.log(`    이미지: ${p.imgSrc}`);
      console.log(`    링크: ${p.href}`);
      console.log(`    텍스트: ${p.text.substring(0, 80)}...`);
    });

    console.log('\n15초 후 종료...');
    await page.waitForTimeout(15000);
  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

analyzePage();
