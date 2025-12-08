/**
 * 도매꾹 상세페이지 구조 분석 v2 - 상세 영역 찾기
 */

import { chromium } from 'playwright';

async function debugDetailPage() {
  console.log('🔍 도매꾹 상세페이지 상세 영역 분석\n');

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

    // 탭/영역 분석
    const pageStructure = await page.evaluate(() => {
      const result: any = {
        tabs: [],
        sections: [],
        detailContainers: [],
      };

      // 탭 요소 찾기
      const tabElements = document.querySelectorAll('[class*="tab"], [id*="tab"], .menu a, .navi a');
      tabElements.forEach((tab) => {
        const text = tab.textContent?.trim() || '';
        if (text.includes('상세') || text.includes('설명') || text.includes('정보')) {
          result.tabs.push({
            text,
            tag: tab.tagName,
            class: (tab as HTMLElement).className,
            id: (tab as HTMLElement).id,
            href: (tab as HTMLAnchorElement).href || '',
          });
        }
      });

      // 주요 섹션 찾기
      const sectionSelectors = [
        '#itemInfo', '#productInfo', '#goodsInfo',
        '.item_info', '.product_info', '.goods_info',
        '#itemDetail', '#productDetail', '#goodsDetail',
        '.item_detail', '.product_detail', '.goods_detail',
        '#prdDetailWrap', '.prdDetailWrap',
        '[id*="detail"]', '[class*="detail"]',
      ];

      for (const sel of sectionSelectors) {
        const elements = document.querySelectorAll(sel);
        elements.forEach((el) => {
          const images = el.querySelectorAll('img');
          const imgCount = images.length;

          // 상품 상세 이미지 (upload/item 포함) 개수
          let detailImageCount = 0;
          images.forEach((img) => {
            const src = img.src || img.getAttribute('data-src') || '';
            if (src.includes('upload/item')) {
              detailImageCount++;
            }
          });

          result.sections.push({
            selector: sel,
            tag: el.tagName,
            id: el.id,
            className: (el.className || '').substring(0, 50),
            allImageCount: imgCount,
            detailImageCount,
            htmlLength: el.innerHTML.length,
          });
        });
      }

      // 상세 설명 컨테이너 찾기 - div 중 이미지가 많은 것
      const allDivs = document.querySelectorAll('div');
      const divAnalysis: any[] = [];

      allDivs.forEach((div, idx) => {
        const images = div.querySelectorAll('img');
        let detailImgCount = 0;
        const imgSrcs: string[] = [];

        images.forEach((img) => {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src.includes('upload/item')) {
            detailImgCount++;
            if (imgSrcs.length < 3) {
              imgSrcs.push(src.substring(0, 80));
            }
          }
        });

        // 상세 이미지 5개 이상 포함된 div
        if (detailImgCount >= 5 && detailImgCount <= 100) {
          // 자식 div 중에 더 많은 이미지를 가진 게 있으면 제외
          let hasChildWithMoreImages = false;
          div.querySelectorAll('div').forEach((child) => {
            if (child === div) return;
            let childCount = 0;
            child.querySelectorAll('img').forEach((img) => {
              const src = img.src || img.getAttribute('data-src') || '';
              if (src.includes('upload/item')) childCount++;
            });
            if (childCount >= detailImgCount * 0.8) {
              hasChildWithMoreImages = true;
            }
          });

          if (!hasChildWithMoreImages) {
            divAnalysis.push({
              idx,
              id: div.id,
              className: (div.className || '').substring(0, 50),
              detailImageCount: detailImgCount,
              sampleImages: imgSrcs,
              position: div.getBoundingClientRect().top,
            });
          }
        }
      });

      // 상세 이미지 수로 정렬
      divAnalysis.sort((a, b) => b.detailImageCount - a.detailImageCount);
      result.detailContainers = divAnalysis.slice(0, 5);

      return result;
    });

    console.log('=== 탭 요소 ===');
    pageStructure.tabs.forEach((tab: any, idx: number) => {
      console.log(`[${idx + 1}] "${tab.text}" - ${tab.tag} id=${tab.id} class=${tab.class}`);
    });

    console.log('\n=== 섹션 분석 ===');
    pageStructure.sections.forEach((sec: any, idx: number) => {
      console.log(`[${idx + 1}] ${sec.selector}`);
      console.log(`    id=${sec.id}, class=${sec.className}`);
      console.log(`    전체 이미지: ${sec.allImageCount}, 상세 이미지: ${sec.detailImageCount}, HTML: ${sec.htmlLength}`);
    });

    console.log('\n=== 상세 이미지 컨테이너 후보 ===');
    pageStructure.detailContainers.forEach((cont: any, idx: number) => {
      console.log(`[${idx + 1}] id="${cont.id}" class="${cont.className}"`);
      console.log(`    상세 이미지: ${cont.detailImageCount}개, 위치: ${Math.round(cont.position)}px`);
      console.log('    샘플:');
      cont.sampleImages.forEach((src: string) => console.log(`      - ${src}`));
    });

    // 메인 상품 이미지 찾기 (썸네일)
    const mainImage = await page.evaluate(() => {
      // 상품 메인 이미지 - 보통 첫 번째로 큰 이미지
      const allImages = document.querySelectorAll('img');
      let mainImg = '';

      for (const img of allImages) {
        const src = img.src || '';
        // 첫 번째 upload/item 이미지 (가장 큰 것)
        if (src.includes('upload/item') && img.width > 200) {
          mainImg = src;
          break;
        }
      }

      return mainImg;
    });

    console.log('\n=== 메인 상품 이미지 ===');
    console.log(mainImage);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

debugDetailPage();
