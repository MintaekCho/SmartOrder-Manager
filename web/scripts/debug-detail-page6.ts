/**
 * 상세 설명 이미지 vs 다른 상품 이미지 구분
 */

import { chromium } from 'playwright';

async function debug() {
  console.log('🔍 상세 설명 이미지 구분 분석\n');

  const browser = await chromium.launch({
    headless: true,
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
    await page.goto('https://domeggook.com/52792836', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // 스크롤
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(300);
    }
    await page.evaluate(() => window.scrollTo(0, 0));

    // 이미지 분석 - 리스트 영역이 아닌 것들
    const analysis = await page.evaluate(() => {
      const result: any[] = [];
      const allImages = document.querySelectorAll('img');
      const seenUrls = new Set<string>();

      allImages.forEach((img, idx) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (!src || seenUrls.has(src)) return;
        if (!src.includes('upload/item')) return;
        if (src.includes('_stt_') || src.includes('_thum')) return;

        seenUrls.add(src);

        // 부모 경로 추적
        const parents: string[] = [];
        let parent = img.parentElement;
        let depth = 0;
        let isInList = false;

        while (parent && depth < 8) {
          const tag = parent.tagName.toLowerCase();
          const cls = (parent.className || '').toLowerCase();
          const id = (parent.id || '').toLowerCase();

          parents.push(`${tag}${id ? '#' + id : ''}${cls ? '.' + cls.split(' ')[0] : ''}`);

          if (tag === 'li' || cls.includes('list') || cls.includes('swiper') ||
              cls.includes('slide') || cls.includes('recommend') || cls.includes('relation')) {
            isInList = true;
          }

          parent = parent.parentElement;
          depth++;
        }

        const rect = img.getBoundingClientRect();
        const width = img.naturalWidth || img.width;

        result.push({
          idx,
          src: src.substring(0, 100),
          y: Math.round(rect.top + window.scrollY),
          width,
          isInList,
          parents: parents.slice(0, 4).join(' < '),
        });
      });

      return result;
    });

    console.log(`전체 upload/item 이미지: ${analysis.length}개\n`);

    console.log('=== 리스트 영역 이미지 ===');
    const listImages = analysis.filter((img: any) => img.isInList);
    listImages.slice(0, 5).forEach((img: any, i: number) => {
      console.log(`[${i + 1}] y=${img.y} ${img.width}px - ${img.src.substring(0, 60)}`);
      console.log(`    부모: ${img.parents}`);
    });

    console.log(`\n=== 비리스트 이미지 ===`);
    const nonListImages = analysis.filter((img: any) => !img.isInList);
    nonListImages.forEach((img: any, i: number) => {
      console.log(`[${i + 1}] y=${img.y} ${img.width}px - ${img.src.substring(0, 60)}`);
      console.log(`    부모: ${img.parents}`);
    });

    // 페이지 내 특정 영역 확인
    console.log('\n=== 특정 영역 확인 ===');
    const sectionInfo = await page.evaluate(() => {
      const sections: any[] = [];

      // goods_cont 영역
      const goodsCont = document.getElementById('goods_cont');
      if (goodsCont) {
        const imgs = goodsCont.querySelectorAll('img');
        sections.push({
          id: 'goods_cont',
          imageCount: imgs.length,
          html: goodsCont.innerHTML.substring(0, 200),
        });
      }

      // lRWingWrap 영역 (이전에 발견)
      const wingWrap = document.getElementById('lRWingWrap');
      if (wingWrap) {
        const imgs = wingWrap.querySelectorAll('img');
        sections.push({
          id: 'lRWingWrap',
          imageCount: imgs.length,
        });
      }

      return sections;
    });

    sectionInfo.forEach((sec: any) => {
      console.log(`#${sec.id}: ${sec.imageCount}개 이미지`);
      if (sec.html) console.log(`  HTML: ${sec.html.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debug();
