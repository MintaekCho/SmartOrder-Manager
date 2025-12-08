/**
 * 도매꾹 상품 목록 HTML 구조 추출
 */

import { chromium } from 'playwright';

async function extractStructure() {
  console.log('🔍 도매꾹 상품 목록 구조 추출\n');

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
      await searchInput.fill('과일');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(5000);
    }

    // HTML 구조 분석
    const structure = await page.evaluate(() => {
      const result: any = {
        tables: [],
        trs: [],
        items: [],
      };

      // 테이블 찾기
      document.querySelectorAll('table').forEach((table, idx) => {
        if (idx > 5) return;
        result.tables.push({
          class: table.className,
          id: table.id,
          rows: table.rows.length,
        });
      });

      // TR 분석 (테이블 행)
      document.querySelectorAll('tr').forEach((tr, idx) => {
        if (idx > 30) return;
        const img = tr.querySelector('img');
        const tds = tr.querySelectorAll('td');
        const text = tr.textContent || '';
        const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);
        const link = tr.querySelector('a');

        if (img && tds.length > 2) {
          result.trs.push({
            idx,
            class: tr.className,
            tdCount: tds.length,
            hasImg: !!img,
            imgSrc: (img.src || '').substring(0, 80),
            hasPrice: !!priceMatch,
            price: priceMatch ? priceMatch[1] : null,
            href: link ? link.href.substring(0, 80) : null,
            textSample: text.substring(0, 100).replace(/\s+/g, ' ').trim(),
          });
        }
      });

      // 더 상세한 셀렉터 시도
      const selectors = [
        'table tr',
        '.goods_list tr',
        '.item_list tr',
        'table tbody tr',
        '#goods_list tr',
        '.list_item',
        '.product_item',
      ];

      for (const sel of selectors) {
        const elements = document.querySelectorAll(sel);
        if (elements.length > 0) {
          result.items.push({
            selector: sel,
            count: elements.length,
          });
        }
      }

      // 첫 번째 상품 행의 상세 구조
      const firstRow = document.querySelector('tr:has(img)');
      if (firstRow) {
        const cells = firstRow.querySelectorAll('td');
        result.firstRowDetail = {
          cellCount: cells.length,
          cells: Array.from(cells).slice(0, 8).map((td, i) => ({
            idx: i,
            class: td.className,
            html: td.innerHTML.substring(0, 200),
          })),
        };
      }

      return result;
    });

    console.log('📊 테이블 구조:');
    console.log(JSON.stringify(structure.tables, null, 2));

    console.log('\n📊 TR 행 (이미지 포함):');
    structure.trs.slice(0, 5).forEach((tr: any) => {
      console.log(`\n[${tr.idx}] class="${tr.class}"`);
      console.log(`    TD: ${tr.tdCount}개, 이미지: ${tr.hasImg}, 가격: ${tr.price}원`);
      console.log(`    링크: ${tr.href}`);
      console.log(`    텍스트: ${tr.textSample}`);
    });

    console.log('\n📊 발견된 셀렉터:');
    structure.items.forEach((item: any) => {
      console.log(`  ${item.selector}: ${item.count}개`);
    });

    if (structure.firstRowDetail) {
      console.log('\n📊 첫 번째 행의 셀 구조:');
      structure.firstRowDetail.cells.forEach((cell: any) => {
        console.log(`\n[TD ${cell.idx}] class="${cell.class}"`);
        console.log(`  HTML: ${cell.html.substring(0, 150)}...`);
      });
    }

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await browser.close();
  }
}

extractStructure();
