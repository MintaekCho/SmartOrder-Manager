/**
 * 쿠팡 실제 크롤러
 * Playwright를 사용하여 쿠팡 베스트셀러 상품 정보를 수집
 * Stealth 모드로 봇 탐지 우회
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

// 랜덤 User-Agent 목록
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
}

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
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const userAgent = getRandomUserAgent();

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent,
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        geolocation: { latitude: 37.5665, longitude: 126.978 },
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      this.page = await this.context.newPage();

      // 강화된 Stealth 설정
      await this.page.addInitScript(() => {
        // navigator.webdriver 숨기기
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });

        // Chrome 속성 추가
        (window as any).chrome = { runtime: {} };

        // Permissions API 수정
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) =>
          parameters.name === 'notifications'
            ? Promise.resolve({ state: 'denied' } as PermissionStatus)
            : originalQuery(parameters);

        // Plugin 배열 수정
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });

        // Languages 설정
        Object.defineProperty(navigator, 'languages', {
          get: () => ['ko-KR', 'ko', 'en-US', 'en'],
        });

        // WebGL 정보 수정
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return 'Intel Inc.';
          if (parameter === 37446) return 'Intel Iris OpenGL Engine';
          return getParameter.call(this, parameter);
        };
      });

      this.isInitialized = true;
      console.log('[CoupangCrawler] Stealth 모드 브라우저 초기화 완료');
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
      // 1. 먼저 쿠팡 메인 페이지 방문하여 쿠키 획득
      console.log('[CoupangCrawler] 메인 페이지 방문 중...');
      await this.page!.goto('https://www.coupang.com', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await randomDelay(2000, 4000);

      // 2. 검색창을 통해 검색 (더 자연스러운 방식)
      console.log(`[CoupangCrawler] 검색어 입력: ${keyword}`);
      const searchInput = await this.page!.$('input.search-input, input[name="q"], #headerSearchKeyword');

      if (searchInput) {
        await searchInput.click();
        await randomDelay(300, 600);
        await searchInput.fill(keyword);
        await randomDelay(500, 1000);
        await this.page!.keyboard.press('Enter');
        await randomDelay(3000, 5000);
      } else {
        // 검색창을 못 찾으면 URL로 직접 이동
        const searchUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}&channel=user&page=${page}`;
        console.log(`[CoupangCrawler] URL로 직접 이동: ${searchUrl}`);
        await this.page!.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await randomDelay(3000, 5000);
      }

      console.log(`[CoupangCrawler] 현재 URL: ${this.page!.url()}`);

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
