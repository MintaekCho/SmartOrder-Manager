/**
 * 도매꾹 상품 찾기 - 더 유연한 방식
 */

import { chromium } from 'playwright';

async function findProducts() {
  console.log('🔍 도매꾹 상품 찾기\n');

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

    await page.$eval('#searchWordForm', (el: any) => el.value = '마스크');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);

    // 페이지 HTML 일부 확인
    const htmlSample = await page.evaluate(() => {
      // 이미지가 있는 요소들 찾기
      const allImages = document.querySelectorAll('img');
      const productImages: any[] = [];

      allImages.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        // 상품 이미지로 보이는 것들
        if (src.includes('goods') || src.includes('product') || src.includes('item') ||
            (src.includes('cdn') && img.width > 50 && img.height > 50)) {

          // 부모 요소들 탐색
          let parent: any = img.parentElement;
          let depth = 0;
          let productContainer = null;
          let productLink = null;
          let productPrice = null;

          while (parent && depth < 10) {
            // 링크 찾기
            const link = parent.querySelector('a');
            if (link && !productLink) {
              productLink = link.href;
            }

            // 가격 찾기
            const text = parent.textContent || '';
            const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);
            if (priceMatch && !productPrice) {
              productPrice = priceMatch[1];
            }

            // 상품 컨테이너로 보이는지
            if (productLink && productPrice && !productContainer) {
              productContainer = {
                tag: parent.tagName,
                class: parent.className,
                id: parent.id,
              };
            }

            parent = parent.parentElement;
            depth++;
          }

          if (productLink && productPrice && productImages.length < 15) {
            productImages.push({
              imgSrc: src.substring(0, 80),
              imgSize: `${img.width}x${img.height}`,
              link: productLink.substring(0, 80),
              price: productPrice,
              container: productContainer,
            });
          }
        }
      });

      return productImages;
    });

    console.log(`📦 발견된 상품 후보: ${htmlSample.length}개\n`);

    htmlSample.forEach((item, i) => {
      console.log(`[${i + 1}]`);
      console.log(`   이미지: ${item.imgSrc}`);
      console.log(`   크기: ${item.imgSize}`);
      console.log(`   링크: ${item.link}`);
      console.log(`   가격: ${item.price}원`);
      if (item.container) {
        console.log(`   컨테이너: <${item.container.tag}> class="${item.container.class}"`);
      }
      console.log('');
    });

    // 링크 패턴 분석
    const links = await page.evaluate(() => {
      const allLinks = document.querySelectorAll('a');
      const productLinks: string[] = [];
      allLinks.forEach((a) => {
        const href = a.href;
        if (href.includes('goods_idx') || href.includes('item_idx') || href.includes('goodsDetail')) {
          if (!productLinks.includes(href)) {
            productLinks.push(href.substring(0, 100));
          }
        }
      });
      return productLinks.slice(0, 10);
    });

    console.log('\n🔗 상품 링크 패턴:');
    links.forEach((link, i) => {
      console.log(`[${i + 1}] ${link}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

findProducts();
