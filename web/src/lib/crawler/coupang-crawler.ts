/**
 * 쿠팡 실제 크롤러
 * Playwright를 사용하여 쿠팡 베스트셀러 상품 정보를 수집
 */

import { chromium, Browser, Page } from 'playwright';

export interface CrawledProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  thumbnailUrl: string;
  url: string;
  rating: number;
  reviewCount: number;
  isRocketDelivery: boolean;
  isRocketFresh: boolean;
  isFreeShipping: boolean;
  seller: string;
  salesRank: number;
  crawledAt: Date;
}

export interface CrawlResult {
  success: boolean;
  items: CrawledProduct[];
  totalCount: number;
  category: string;
  page: number;
  error?: string;
  debug?: string;
}

export class CoupangCrawler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
      });

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
      });

      this.page = await context.newPage();

      // 봇 탐지 우회
      await this.page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        // @ts-ignore
        window.chrome = { runtime: {} };
      });

      this.isInitialized = true;
      console.log('[CoupangCrawler] 브라우저 초기화 완료');
    } catch (error) {
      console.error('[CoupangCrawler] 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
    }
  }

  async searchProducts(
    keyword: string,
    options: { maxItems?: number; page?: number } = {}
  ): Promise<CrawlResult> {
    const { maxItems = 20, page = 1 } = options;

    if (!this.page) {
      await this.initialize();
    }

    try {
      const searchUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}&channel=user&page=${page}`;
      console.log(`[CoupangCrawler] URL: ${searchUrl}`);

      // 페이지 이동
      const response = await this.page!.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      console.log(`[CoupangCrawler] 응답 상태: ${response?.status()}`);

      // 충분한 대기 시간
      await this.page!.waitForTimeout(3000);

      // HTML 구조 디버깅
      const debugInfo = await this.page!.evaluate(() => {
        const body = document.body;
        const allLi = document.querySelectorAll('li');
        const productLi = document.querySelectorAll('li.search-product');
        const allLinks = document.querySelectorAll('a[href*="products"]');

        return {
          title: document.title,
          bodyLength: body?.innerHTML?.length || 0,
          allLiCount: allLi.length,
          productLiCount: productLi.length,
          productLinksCount: allLinks.length,
          sampleHtml: body?.innerHTML?.substring(0, 2000) || '',
        };
      });

      console.log(`[CoupangCrawler] 디버그:`, JSON.stringify(debugInfo, null, 2).substring(0, 500));

      // 스크롤
      await this.autoScroll();

      // 상품 추출 (개선된 셀렉터)
      const products = await this.page!.evaluate((max) => {
        const items: any[] = [];

        // 여러 가능한 셀렉터 시도
        let productElements = document.querySelectorAll('li.search-product');

        if (productElements.length === 0) {
          productElements = document.querySelectorAll('ul#productList > li');
        }
        if (productElements.length === 0) {
          productElements = document.querySelectorAll('.search-product-list li');
        }
        if (productElements.length === 0) {
          // 모든 li 중 상품 링크가 있는 것
          const allLi = document.querySelectorAll('li');
          const filtered: Element[] = [];
          allLi.forEach(li => {
            if (li.querySelector('a[href*="/vp/products/"]') || li.querySelector('a[href*="itemId="]')) {
              filtered.push(li);
            }
          });
          productElements = filtered as unknown as NodeListOf<Element>;
        }

        console.log(`[Browser] 찾은 상품 수: ${productElements.length}`);

        Array.from(productElements).slice(0, max).forEach((card, index) => {
          try {
            // 링크에서 상품 정보 추출
            const linkEl = card.querySelector('a[href*="products"], a[href*="itemId"]') as HTMLAnchorElement;
            if (!linkEl) return;

            const url = linkEl.href;
            const idMatch = url.match(/products\/(\d+)/) || url.match(/itemId=(\d+)/);
            const id = idMatch ? idMatch[1] : `item-${index}`;

            // 상품명 - 여러 방법 시도
            let name = '';
            const nameSelectors = [
              'div.name',
              '.name',
              'div.title',
              '.title',
              'div[class*="name"]',
              'div[class*="title"]',
              'dd.descriptions',
            ];
            for (const sel of nameSelectors) {
              const el = card.querySelector(sel);
              if (el?.textContent?.trim()) {
                name = el.textContent.trim();
                break;
              }
            }
            // 이미지 alt에서도 시도
            if (!name) {
              const img = card.querySelector('img');
              name = img?.alt || '';
            }

            // 가격
            let price = 0;
            const priceSelectors = [
              'strong.price-value',
              '.price-value',
              'em.sale',
              '.price strong',
              'span[class*="price"]',
            ];
            for (const sel of priceSelectors) {
              const el = card.querySelector(sel);
              const text = el?.textContent?.replace(/[^0-9]/g, '');
              if (text && parseInt(text) > 0) {
                price = parseInt(text);
                break;
              }
            }

            // 이미지
            const imgEl = card.querySelector('img');
            let thumbnailUrl = imgEl?.src || imgEl?.getAttribute('data-img-src') || '';
            if (thumbnailUrl.startsWith('//')) {
              thumbnailUrl = 'https:' + thumbnailUrl;
            }

            // 평점
            const ratingEl = card.querySelector('.rating, em.rating');
            const rating = parseFloat(ratingEl?.textContent?.match(/[\d.]+/)?.[0] || '0');

            // 리뷰
            const reviewEl = card.querySelector('.rating-total-count, .count');
            const reviewCount = parseInt(reviewEl?.textContent?.replace(/[^0-9]/g, '') || '0');

            // 로켓배송
            const isRocketDelivery = !!card.querySelector('[class*="rocket"], img[alt*="로켓"]');
            const isRocketFresh = !!card.querySelector('[class*="fresh"], img[alt*="프레시"]');

            if (name && price > 0) {
              items.push({
                id,
                name: name.substring(0, 100),
                price,
                thumbnailUrl,
                url,
                rating,
                reviewCount,
                isRocketDelivery,
                isRocketFresh,
                isFreeShipping: isRocketDelivery,
                seller: isRocketDelivery ? '로켓배송' : '',
                salesRank: index + 1,
              });
            }
          } catch (e) {
            console.error('추출 오류:', e);
          }
        });

        return items;
      }, maxItems);

      console.log(`[CoupangCrawler] ${products.length}개 상품 수집 완료`);

      return {
        success: true,
        items: products.map(p => ({ ...p, crawledAt: new Date() })),
        totalCount: products.length,
        category: `search:${keyword}`,
        page,
        debug: `title: ${debugInfo.title}, li: ${debugInfo.allLiCount}, productLi: ${debugInfo.productLiCount}`,
      };
    } catch (error) {
      console.error('[CoupangCrawler] 크롤링 실패:', error);
      return {
        success: false,
        items: [],
        totalCount: 0,
        category: `search:${keyword}`,
        page,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  private async autoScroll(): Promise<void> {
    if (!this.page) return;

    for (let i = 0; i < 5; i++) {
      await this.page.evaluate(() => window.scrollBy(0, 500));
      await this.page.waitForTimeout(300);
    }
    await this.page.waitForTimeout(1000);
  }

  async crawlFreshBestSellers(
    category: 'fruits' | 'vegetables' | 'seafood' | 'meat' | 'all' = 'all',
    maxItems: number = 20
  ): Promise<CrawlResult> {
    const keywords: Record<string, string> = {
      fruits: '과일',
      vegetables: '채소',
      seafood: '수산물',
      meat: '정육 고기',
      all: '신선식품',
    };

    return this.searchProducts(keywords[category] || '신선식품', { maxItems });
  }
}

let crawlerInstance: CoupangCrawler | null = null;

export function getCoupangCrawler(): CoupangCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new CoupangCrawler();
  }
  return crawlerInstance;
}

export async function closeCoupangCrawler(): Promise<void> {
  if (crawlerInstance) {
    await crawlerInstance.close();
    crawlerInstance = null;
  }
}
