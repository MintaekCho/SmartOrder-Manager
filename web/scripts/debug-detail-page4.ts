/**
 * 도매꾹 상세페이지 - 실제 상세 설명 이미지만 추출
 */

import { chromium } from 'playwright';

async function debugDetailPage() {
  console.log('🔍 도매꾹 상세 설명 이미지 추출\n');

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
      await page.waitForTimeout(3000);
    }

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
      console.log('상품 링크 없음');
      return;
    }

    console.log(`📦 상품 페이지: ${productLink}\n`);
    await page.goto(productLink, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 스크롤
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    // 상세 설명 이미지 추출 - 더 정확한 방법
    const detailResult = await page.evaluate(() => {
      const result: any = {
        mainImage: '',
        detailImages: [],
        allImageAnalysis: [],
      };

      // 1. 메인 상품 이미지 찾기 (상단에 큰 이미지)
      const allImages = document.querySelectorAll('img');
      const seenUrls = new Set<string>();

      // 메인 이미지 후보
      let mainImageCandidates: Array<{src: string, width: number, y: number}> = [];

      allImages.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (!src.includes('upload/item')) return;

        const rect = img.getBoundingClientRect();
        const y = rect.top;
        const width = img.naturalWidth || img.width;

        // 상단 500px 이내의 큰 이미지
        if (y < 500 && width > 200) {
          mainImageCandidates.push({ src, width, y });
        }
      });

      // 가장 큰 이미지를 메인으로
      mainImageCandidates.sort((a, b) => b.width - a.width);
      if (mainImageCandidates.length > 0) {
        result.mainImage = mainImageCandidates[0].src;
      }

      // 메인 이미지의 상품 ID 추출 (경로에서)
      const mainImagePath = result.mainImage || '';
      const mainProductId = mainImagePath.match(/upload\/item\/\d{4}\/\d{2}\/\d{2}\/(\w{20,})/)?.[1] || '';

      console.log('메인 이미지 ID:', mainProductId);

      // 2. 상세 설명 이미지 찾기
      // 방법: 상품 설명 영역에 있는 이미지 (리스트형 이미지가 아닌 것)

      // _stt_ 패턴은 썸네일이므로 제외
      // 다른 상품의 ID를 가진 이미지도 제외

      allImages.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (!src || seenUrls.has(src)) return;
        if (!src.includes('upload/item')) return;

        // 썸네일 제외 (_stt_ 패턴)
        if (src.includes('_stt_')) return;

        // 이미지 ID 추출
        const imageIdMatch = src.match(/upload\/item\/\d{4}\/\d{2}\/\d{2}\/(\w{20,})/);
        const imageId = imageIdMatch ? imageIdMatch[1] : '';

        // 부모 요소 확인 - 리스트 항목 안에 있으면 제외
        let parent = img.parentElement;
        let isInList = false;
        let depth = 0;

        while (parent && depth < 5) {
          const tag = parent.tagName.toLowerCase();
          const className = parent.className || '';

          // 리스트/그리드 컨테이너 안에 있으면 제외
          if (tag === 'li' || className.includes('list') || className.includes('grid') ||
              className.includes('slide') || className.includes('swiper') ||
              className.includes('item_box') || className.includes('prd_list')) {
            isInList = true;
            break;
          }
          parent = parent.parentElement;
          depth++;
        }

        if (isInList) return;

        // 이미지 크기 체크 - 너무 작은 건 제외
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (width < 200 && height < 200) return;

        seenUrls.add(src);

        const rect = img.getBoundingClientRect();
        result.allImageAnalysis.push({
          src: src.substring(0, 100),
          imageId: imageId.substring(0, 20),
          width,
          height,
          y: Math.round(rect.top + window.scrollY),
          isMainProduct: imageId === mainProductId,
        });

        result.detailImages.push(src);
      });

      return result;
    });

    console.log('=== 메인 상품 이미지 ===');
    console.log(detailResult.mainImage);

    console.log(`\n=== 상세 설명 이미지 후보: ${detailResult.detailImages.length}개 ===`);
    detailResult.allImageAnalysis.slice(0, 15).forEach((img: any, idx: number) => {
      const mark = img.isMainProduct ? '★' : '';
      console.log(`[${idx + 1}] ${mark} ${img.width}x${img.height} y=${img.y}`);
      console.log(`    ID: ${img.imageId}`);
      console.log(`    ${img.src}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDetailPage();
