/**
 * 도매꾹 상세페이지 - 정확한 상세 이미지 추출
 */

import { chromium } from 'playwright';

async function debugDetailPage() {
  console.log('🔍 도매꾹 상세페이지 정확한 이미지 추출\n');

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

    // URL에서 상품 ID 추출
    const productIdMatch = productLink.match(/domeggook\.com\/(\d+)/);
    const productId = productIdMatch ? productIdMatch[1] : null;

    console.log(`📦 상품 페이지: ${productLink}`);
    console.log(`📦 상품 ID: ${productId}\n`);

    await page.goto(productLink, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 페이지 끝까지 스크롤 (lazy loading 이미지 로드)
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(500);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);

    // 이미지 추출
    const imageAnalysis = await page.evaluate((pid) => {
      const allImages = document.querySelectorAll('img');
      const images: any[] = [];
      const seenUrls = new Set<string>();

      allImages.forEach((img, idx) => {
        const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
        if (!src || seenUrls.has(src)) return;

        if (!src.includes('upload/item')) return;

        seenUrls.add(src);

        // 이미지 경로에서 날짜 패턴 추출 (2025/09/21 형식)
        const pathMatch = src.match(/upload\/item\/(\d{4})\/(\d{2})\/(\d{2})\/(\w+)/);
        const imagePath = pathMatch ? pathMatch[0] : '';
        const imageId = pathMatch ? pathMatch[4] : '';

        // 부모 요소 정보
        let parents: string[] = [];
        let parent = img.parentElement;
        let depth = 0;
        while (parent && depth < 3) {
          parents.push(`${parent.tagName}${parent.id ? '#' + parent.id : ''}${parent.className ? '.' + parent.className.split(' ')[0] : ''}`);
          parent = parent.parentElement;
          depth++;
        }

        // Y 좌표
        const rect = img.getBoundingClientRect();

        images.push({
          idx,
          src: src.substring(0, 120),
          imageId: imageId.substring(0, 30),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          y: Math.round(rect.top + window.scrollY),
          parents: parents.join(' < '),
        });
      });

      return images;
    }, productId);

    console.log(`=== 모든 upload/item 이미지: ${imageAnalysis.length}개 ===\n`);

    // 위치 기준으로 그룹핑
    const headerImages = imageAnalysis.filter((img: any) => img.y < 500);
    const middleImages = imageAnalysis.filter((img: any) => img.y >= 500 && img.y < 1500);
    const detailImages = imageAnalysis.filter((img: any) => img.y >= 1500);

    console.log(`=== 상단 이미지 (y < 500): ${headerImages.length}개 ===`);
    headerImages.slice(0, 3).forEach((img: any) => {
      console.log(`  [${img.idx}] y=${img.y}, ${img.width}x${img.height}`);
      console.log(`       ${img.src}`);
      console.log(`       ${img.parents}`);
    });

    console.log(`\n=== 중간 이미지 (500 <= y < 1500): ${middleImages.length}개 ===`);
    middleImages.slice(0, 3).forEach((img: any) => {
      console.log(`  [${img.idx}] y=${img.y}, ${img.width}x${img.height}`);
      console.log(`       ${img.src}`);
    });

    console.log(`\n=== 하단 이미지 (y >= 1500): ${detailImages.length}개 ===`);
    detailImages.slice(0, 5).forEach((img: any) => {
      console.log(`  [${img.idx}] y=${img.y}, ${img.width}x${img.height}`);
      console.log(`       ${img.src}`);
    });

    // 상세 설명 영역 찾기 - "상세정보" 텍스트 근처
    const detailSectionImages = await page.evaluate(() => {
      // 상세정보 제목 찾기
      const headings = document.querySelectorAll('h1, h2, h3, h4, strong, b, .title');
      let detailStartY = 0;

      for (const heading of headings) {
        const text = heading.textContent?.trim() || '';
        if (text.includes('상세') || text.includes('설명') || text.includes('정보')) {
          const rect = heading.getBoundingClientRect();
          detailStartY = rect.top + window.scrollY;
          break;
        }
      }

      // 상세정보 영역 이후의 이미지들
      const detailImages: string[] = [];
      const seenUrls = new Set<string>();
      const allImages = document.querySelectorAll('img');

      allImages.forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (!src.includes('upload/item') || seenUrls.has(src)) return;

        const rect = img.getBoundingClientRect();
        const y = rect.top + window.scrollY;

        // 상세정보 시작점 이후, 또는 상단 메인 이미지가 아닌 경우
        // 메인 이미지는 보통 큰 크기이고 상단에 위치
        const isMainImage = y < 400 && (img.width > 300 || img.naturalWidth > 300);

        if (!isMainImage && y > 400) {
          seenUrls.add(src);
          detailImages.push(src);
        }
      });

      return {
        detailStartY,
        images: detailImages,
      };
    });

    console.log(`\n=== 상세 설명 영역 이미지 ===`);
    console.log(`상세 영역 시작 Y: ${detailSectionImages.detailStartY}`);
    console.log(`이미지 수: ${detailSectionImages.images.length}`);
    detailSectionImages.images.slice(0, 10).forEach((src, idx) => {
      console.log(`[${idx + 1}] ${src.substring(0, 100)}`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDetailPage();
