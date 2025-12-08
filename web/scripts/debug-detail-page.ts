/**
 * 도매꾹 상세페이지 구조 분석
 */

import { chromium } from 'playwright';

async function debugDetailPage() {
  console.log('🔍 도매꾹 상세페이지 구조 분석\n');

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
    // 먼저 메인페이지 방문
    await page.goto('https://domeggook.com', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 검색 후 첫 번째 상품 클릭
    const searchInput = await page.$('#searchWordForm');
    if (searchInput) {
      await searchInput.fill('마스크');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }

    // 첫 번째 상품 링크 찾기
    const productLink = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        const href = link.href;
        if (href.match(/domeggook\.com\/\d{5,}/)) {
          return href;
        }
      }
      return null;
    });

    if (!productLink) {
      console.log('상품 링크를 찾을 수 없습니다.');
      return;
    }

    console.log(`📦 상품 페이지: ${productLink}\n`);

    // 상세페이지 이동
    await page.goto(productLink, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 페이지 구조 분석
    const pageAnalysis = await page.evaluate(() => {
      const result: any = {
        allImages: [],
        potentialDetailAreas: [],
        iframes: [],
      };

      // 모든 이미지 분석
      const allImages = document.querySelectorAll('img');
      allImages.forEach((img, idx) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (!src) return;

        // 부모 요소들의 ID/class 수집
        let parents: string[] = [];
        let parent = img.parentElement;
        let depth = 0;
        while (parent && depth < 5) {
          const info = `${parent.tagName}${parent.id ? '#' + parent.id : ''}${parent.className ? '.' + parent.className.split(' ')[0] : ''}`;
          parents.push(info);
          parent = parent.parentElement;
          depth++;
        }

        result.allImages.push({
          idx,
          src: src.substring(0, 100),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          parents: parents.join(' > '),
        });
      });

      // 상세 설명 영역으로 보이는 요소들
      const detailSelectors = [
        '#prdDetail', '#productDetail', '.prd_detail', '.product_detail',
        '.goods_desc', '.item_desc', '.detail_area', '.detail_content',
        '.goods_explain', '.goods_detail', '#goods_explain', '#item_detail',
        '.info_detail', '.prd_info_detail', 'div[class*="detail"]',
        'div[class*="explain"]', 'div[class*="desc"]'
      ];

      for (const selector of detailSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          const images = el.querySelectorAll('img');
          const imgSrcs: string[] = [];
          images.forEach((img) => {
            const src = img.src || img.getAttribute('data-src') || '';
            if (src) imgSrcs.push(src.substring(0, 80));
          });

          if (imgSrcs.length > 0 || el.innerHTML.length > 500) {
            result.potentialDetailAreas.push({
              selector,
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').substring(0, 50),
              imageCount: imgSrcs.length,
              htmlLength: el.innerHTML.length,
              sampleImages: imgSrcs.slice(0, 3),
            });
          }
        });
      }

      // iframe 확인 (상세 설명이 iframe에 있을 수 있음)
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe, idx) => {
        result.iframes.push({
          idx,
          src: iframe.src || '',
          name: iframe.name || '',
          id: iframe.id || '',
        });
      });

      return result;
    });

    console.log('=== 전체 이미지 목록 (상위 10개) ===');
    pageAnalysis.allImages.slice(0, 10).forEach((img: any) => {
      console.log(`[${img.idx}] ${img.src}`);
      console.log(`    크기: ${img.width}x${img.height}`);
      console.log(`    부모: ${img.parents}`);
      console.log('');
    });

    console.log('\n=== 상세 설명 영역 후보 ===');
    pageAnalysis.potentialDetailAreas.forEach((area: any, idx: number) => {
      console.log(`[${idx + 1}] ${area.selector}`);
      console.log(`    태그: ${area.tag}, ID: ${area.id}, Class: ${area.className}`);
      console.log(`    이미지 수: ${area.imageCount}, HTML 길이: ${area.htmlLength}`);
      if (area.sampleImages.length > 0) {
        console.log(`    샘플 이미지:`);
        area.sampleImages.forEach((src: string) => console.log(`      - ${src}`));
      }
      console.log('');
    });

    console.log('\n=== iframe 목록 ===');
    pageAnalysis.iframes.forEach((iframe: any) => {
      console.log(`[${iframe.idx}] src: ${iframe.src}, name: ${iframe.name}, id: ${iframe.id}`);
    });

    // 스크롤 후 추가 이미지 확인
    console.log('\n=== 스크롤 후 추가 분석 ===');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const afterScrollImages = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      const newImages: string[] = [];
      images.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && src.includes('upload/item')) {
          newImages.push(src.substring(0, 100));
        }
      });
      return newImages;
    });

    console.log(`upload/item 패턴 이미지: ${afterScrollImages.length}개`);
    afterScrollImages.slice(0, 5).forEach((src, idx) => {
      console.log(`[${idx + 1}] ${src}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDetailPage();
