/**
 * 도매꾹 상세 설명 영역 찾기 - HTML 분석
 */

import { chromium } from 'playwright';

async function debug() {
  console.log('🔍 도매꾹 상세 설명 영역 HTML 분석\n');

  const browser = await chromium.launch({
    headless: false, // 시각적으로 확인
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  try {
    // 테스트 상품 - 상세 이미지가 많을 것 같은 의류
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const searchInput = await page.$('#searchWordForm');
    if (searchInput) {
      await searchInput.fill('원피스');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // 첫 번째 상품 선택
    const productLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.href.match(/domeggook\.com\/\d{5,}/)) {
          return link.href;
        }
      }
      return null;
    });

    if (!productLink) {
      console.log('상품 없음');
      return;
    }

    console.log(`📦 상품: ${productLink}\n`);
    await page.goto(productLink, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 페이지 스크롤해서 모든 컨텐츠 로드
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // 상세 설명 영역 찾기
    const detailAnalysis = await page.evaluate(() => {
      const result: any = {
        foundAreas: [],
        iframes: [],
        tables: [],
      };

      // 1. 일반적인 상세 설명 컨테이너 찾기
      const containerSelectors = [
        '#goods_cont', '#item_detail', '#prdDetail',
        '.goods_cont', '.item_detail', '.prd_detail',
        '#content_detail', '.content_detail',
        'div[id*="detail"]', 'div[id*="content"]',
      ];

      for (const sel of containerSelectors) {
        const els = document.querySelectorAll(sel);
        els.forEach((el) => {
          const imgs = el.querySelectorAll('img');
          if (imgs.length > 0) {
            const imgSrcs: string[] = [];
            imgs.forEach((img) => {
              const src = img.src || img.getAttribute('data-src') || '';
              if (src && imgSrcs.length < 5) imgSrcs.push(src.substring(0, 80));
            });

            result.foundAreas.push({
              selector: sel,
              id: el.id,
              className: (el.className || '').substring(0, 50),
              imageCount: imgs.length,
              sampleImages: imgSrcs,
            });
          }
        });
      }

      // 2. iframe 확인 (상세 설명이 iframe에 있을 수 있음)
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        const src = iframe.src || '';
        if (src && (src.includes('detail') || src.includes('content') || src.includes('item'))) {
          result.iframes.push({
            src: src.substring(0, 100),
            name: iframe.name || '',
            id: iframe.id || '',
          });
        }
      });

      // 3. 테이블 기반 상세 설명 확인
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        const imgs = table.querySelectorAll('img');
        if (imgs.length > 2) {
          const imgSrcs: string[] = [];
          imgs.forEach((img) => {
            const src = img.src || '';
            if (src && imgSrcs.length < 3) imgSrcs.push(src.substring(0, 80));
          });

          result.tables.push({
            imageCount: imgs.length,
            className: (table.className || '').substring(0, 30),
            sampleImages: imgSrcs,
          });
        }
      });

      return result;
    });

    console.log('=== 발견된 상세 영역 ===');
    detailAnalysis.foundAreas.forEach((area: any, idx: number) => {
      console.log(`[${idx + 1}] ${area.selector}`);
      console.log(`    id=${area.id}, class=${area.className}`);
      console.log(`    이미지: ${area.imageCount}개`);
      if (area.sampleImages.length > 0) {
        console.log('    샘플:');
        area.sampleImages.forEach((src: string) => console.log(`      ${src}`));
      }
    });

    console.log('\n=== 관련 iframe ===');
    detailAnalysis.iframes.forEach((iframe: any) => {
      console.log(`  src: ${iframe.src}`);
      console.log(`  name: ${iframe.name}, id: ${iframe.id}`);
    });

    console.log('\n=== 이미지 있는 테이블 ===');
    detailAnalysis.tables.forEach((table: any, idx: number) => {
      console.log(`[${idx + 1}] ${table.imageCount}개 이미지, class=${table.className}`);
      table.sampleImages.forEach((src: string) => console.log(`    ${src}`));
    });

    // 스크린샷 저장
    await page.screenshot({ path: '/tmp/domeggook-detail.png', fullPage: true });
    console.log('\n스크린샷 저장: /tmp/domeggook-detail.png');

    // 10초 대기 (시각적 확인용)
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debug();
