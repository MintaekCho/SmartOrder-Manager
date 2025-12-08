/**
 * 도매꾹 페이지 구조 디버깅
 */

import { chromium } from 'playwright';

async function debugDomeggook() {
  console.log('🔍 도매꾹 페이지 구조 분석\n');

  const browser = await chromium.launch({
    headless: false, // UI 표시
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();

  // Stealth 설정
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // 1. 메인페이지 방문
    console.log('1. 메인페이지 방문...');
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 2. 검색창 찾기
    console.log('2. 검색창 분석...');
    const searchForms = await page.$$eval('form', (forms) =>
      forms.map((f) => ({
        action: f.action,
        method: f.method,
        id: f.id,
        class: f.className,
      }))
    );
    console.log('   폼 목록:', JSON.stringify(searchForms.slice(0, 5), null, 2));

    const searchInputs = await page.$$eval('input[type="text"], input[type="search"]', (inputs) =>
      inputs.map((i) => ({
        name: (i as HTMLInputElement).name,
        id: i.id,
        placeholder: (i as HTMLInputElement).placeholder,
        class: i.className,
      }))
    );
    console.log('   검색 인풋:', JSON.stringify(searchInputs.slice(0, 5), null, 2));

    // 3. 실제 검색 수행
    console.log('3. 검색 수행...');
    const searchInput = await page.$('input[name="search_text"], input[name="keyword"], input[name="sword"], #search');
    if (searchInput) {
      await searchInput.fill('과일');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);

      // 현재 URL 확인
      console.log('   검색 후 URL:', page.url());

      // 스크린샷
      await page.screenshot({ path: 'debug-search-result.png' });
      console.log('   스크린샷 저장: debug-search-result.png');

      // 상품 요소 분석
      console.log('4. 상품 요소 분석...');
      const analysis = await page.evaluate(() => {
        const result: any = {
          bodyLength: document.body.innerHTML.length,
          classes: {},
          products: [],
        };

        // 클래스별 요소 개수
        const allElements = document.querySelectorAll('*');
        allElements.forEach((el) => {
          el.classList.forEach((cls) => {
            if (cls.includes('item') || cls.includes('product') || cls.includes('goods')) {
              result.classes[cls] = (result.classes[cls] || 0) + 1;
            }
          });
        });

        // 가격 포함 요소 찾기
        const priceElements = document.querySelectorAll('[class*="price"], *');
        let priceCount = 0;
        priceElements.forEach((el) => {
          if (el.textContent?.match(/\d{1,3}(,\d{3})*원/)) {
            priceCount++;
          }
        });
        result.priceElementCount = priceCount;

        // 이미지가 있는 li/div 찾기
        const potentialProducts = document.querySelectorAll('li, div');
        potentialProducts.forEach((el, idx) => {
          if (idx > 30) return;
          const img = el.querySelector('img');
          const hasPrice = el.textContent?.match(/\d{1,3}(,\d{3})*원/);
          const hasLink = el.querySelector('a');

          if (img && hasPrice && hasLink && el.clientHeight > 100) {
            const href = el.querySelector('a')?.href || '';
            const imgSrc = img.src || img.getAttribute('data-src') || '';
            const text = el.textContent?.substring(0, 100) || '';

            result.products.push({
              tag: el.tagName,
              class: el.className.substring(0, 50),
              href: href.substring(0, 80),
              imgSrc: imgSrc.substring(0, 80),
              text: text.replace(/\s+/g, ' ').trim(),
              height: el.clientHeight,
            });
          }
        });

        return result;
      });

      console.log('   페이지 분석 결과:');
      console.log(`   - HTML 길이: ${analysis.bodyLength}`);
      console.log(`   - 가격 요소: ${analysis.priceElementCount}개`);
      console.log(`   - 관련 클래스:`, JSON.stringify(analysis.classes, null, 2));
      console.log(`   - 잠재 상품: ${analysis.products.length}개`);

      if (analysis.products.length > 0) {
        console.log('\n   상품 샘플:');
        analysis.products.slice(0, 5).forEach((p: any, i: number) => {
          console.log(`   [${i + 1}] ${p.tag}.${p.class}`);
          console.log(`       텍스트: ${p.text.substring(0, 60)}`);
          console.log(`       링크: ${p.href}`);
        });
      }
    } else {
      console.log('   검색창을 찾지 못했습니다.');

      // 대안: 페이지의 모든 input 요소 출력
      const allInputs = await page.$$eval('input', (inputs) =>
        inputs.map((i) => ({
          type: i.type,
          name: i.name,
          id: i.id,
          placeholder: i.placeholder,
        }))
      );
      console.log('   모든 input:', JSON.stringify(allInputs.slice(0, 10), null, 2));
    }

    console.log('\n10초 후 브라우저 종료...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDomeggook();
