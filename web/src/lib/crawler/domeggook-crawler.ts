/**
 * 도매꾹 크롤러
 * Playwright를 사용하여 도매꾹 상품 정보를 수집
 * Stealth 모드로 봇 탐지 우회
 */

import { chromium, Browser, Page, BrowserContext } from 'playwright';

// 랜덤 User-Agent 목록
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// 랜덤 지연
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// 랜덤 User-Agent 선택
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Stealth 설정 적용
async function applyStealthSettings(page: Page): Promise<void> {
  await page.addInitScript(() => {
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
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

    // Languages 설정
    Object.defineProperty(navigator, 'languages', { get: () => ['ko-KR', 'ko', 'en-US', 'en'] });
  });
}

export interface WholesaleProduct {
  id: string;
  name: string;
  price: number;                // 도매가
  retailPrice?: number;         // 권장 소비자가
  minOrderQuantity: number;     // 최소 주문 수량
  thumbnailUrl: string;
  detailImages?: string[];      // 상세 이미지들
  url: string;
  seller: string;
  shippingFee: number;
  category: string;
  origin?: string;              // 원산지
  description?: string;         // 상품 설명
  dropshippingAvailable?: boolean; // 위탁배송 가능
  crawledAt: Date;
}

export interface WholesaleCrawlResult {
  success: boolean;
  items: WholesaleProduct[];
  totalCount: number;
  keyword: string;
  page: number;
  error?: string;
  source?: 'crawl' | 'mock';
}

export class DomeggookCrawler {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private isInitialized = false;
  private readonly baseUrl = 'https://domeggook.com';

  /**
   * 브라우저 초기화 (Stealth 모드)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const userAgent = getRandomUserAgent();

      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      this.context = await this.browser.newContext({
        userAgent,
        viewport: { width: 1280, height: 800 },
        locale: 'ko-KR',
        timezoneId: 'Asia/Seoul',
        geolocation: { latitude: 37.5665, longitude: 126.978 },
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
        },
      });

      this.page = await this.context.newPage();

      // Stealth 설정 적용
      await applyStealthSettings(this.page);

      this.isInitialized = true;
      console.log('[DomeggookCrawler] Stealth 모드 브라우저 초기화 완료');
    } catch (error) {
      console.error('[DomeggookCrawler] 브라우저 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 브라우저 종료
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      console.log('[DomeggookCrawler] 브라우저 종료');
    }
  }

  /**
   * 키워드 검색 (Stealth 모드)
   */
  async search(
    keyword: string,
    options: { maxItems?: number; page?: number } = {}
  ): Promise<WholesaleCrawlResult> {
    const { maxItems = 20, page = 1 } = options;

    if (!this.page) {
      await this.initialize();
    }

    try {
      console.log(`[DomeggookCrawler] Stealth 검색: ${keyword}`);

      // 1. 먼저 메인페이지 방문 (쿠키 획득)
      await this.page!.goto(this.baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await randomDelay(1500, 3000);

      // 2. 검색창에 입력하고 검색 (더 자연스러운 방식)
      const searchInput = await this.page!.$('#searchWordForm, input[name="sw"]');
      if (searchInput) {
        console.log(`[DomeggookCrawler] 검색창 발견, 키워드 입력: ${keyword}`);
        await searchInput.click();
        await randomDelay(200, 500);
        await searchInput.fill(keyword);
        await randomDelay(300, 600);
        await this.page!.keyboard.press('Enter');
        await randomDelay(3000, 5000);
      } else {
        // 대안: URL로 직접 이동
        const searchUrl = `${this.baseUrl}/main/item/itemList.php?sw=${encodeURIComponent(keyword)}`;
        console.log(`[DomeggookCrawler] 검색 URL: ${searchUrl}`);
        await this.page!.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await randomDelay(2000, 4000);
      }

      console.log(`[DomeggookCrawler] 현재 URL: ${this.page!.url()}`);

      // 상품 목록 로딩 대기
      await this.page!.waitForSelector('.item_box, .item_list, .product_list, [class*="item"]', {
        timeout: 10000,
      }).catch(() => {
        console.log('[DomeggookCrawler] 상품 목록 셀렉터 대기 타임아웃');
      });

      // 상품 추출
      const products = await this.extractProducts(maxItems, keyword);

      console.log(`[DomeggookCrawler] ${products.length}개 상품 추출 완료`);

      return {
        success: true,
        items: products,
        totalCount: products.length,
        keyword,
        page,
        source: 'crawl',
      };
    } catch (error) {
      console.error('[DomeggookCrawler] 검색 실패:', error);
      return {
        success: false,
        items: [],
        totalCount: 0,
        keyword,
        page,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 상품 정보 추출 (도매꾹 구조에 맞게 최적화)
   * 도매꾹은 이미지 기반으로 상품을 찾아 부모 요소에서 정보 추출
   */
  private async extractProducts(maxItems: number, category: string): Promise<WholesaleProduct[]> {
    if (!this.page) return [];

    const products = await this.page.evaluate((max) => {
      const items: any[] = [];
      const seenUrls = new Set<string>();

      // 모든 이미지 중 상품 이미지로 보이는 것들 찾기
      const allImages = document.querySelectorAll('img');

      allImages.forEach((img) => {
        if (items.length >= max) return;

        const src = img.src || img.getAttribute('data-src') || '';

        // 상품 이미지 조건: cdn 이미지이고 적절한 크기
        const isProductImage =
          (src.includes('cdn') || src.includes('upload')) &&
          img.width > 50 &&
          img.height > 50 &&
          !src.includes('icon') &&
          !src.includes('logo') &&
          !src.includes('btn') &&
          !src.includes('banner/content'); // 배너 제외

        if (!isProductImage) return;

        // 부모 요소 탐색하며 링크와 가격 찾기
        let parent: HTMLElement | null = img.parentElement;
        let depth = 0;
        let productLink = '';
        let productPrice = 0;
        let productName = '';

        while (parent && depth < 8) {
          // 상품 링크 찾기 (숫자 ID 패턴)
          if (!productLink) {
            const links = parent.querySelectorAll('a');
            links.forEach((link) => {
              const href = link.href;
              // 도매꾹 상품 URL 패턴: domeggook.com/숫자
              const match = href.match(/domeggook\.com\/(\d{5,})/);
              if (match && !productLink) {
                productLink = href;
              }
            });
          }

          // 가격 찾기
          if (!productPrice) {
            const text = parent.textContent || '';
            const priceMatch = text.match(/(\d{1,3}(,\d{3})*)\s*원/);
            if (priceMatch) {
              const priceNum = parseInt(priceMatch[1].replace(/,/g, ''), 10);
              if (priceNum > 100 && priceNum < 10000000) {
                productPrice = priceNum;
              }
            }
          }

          // 상품명 찾기
          if (!productName && productLink) {
            const linkEl = parent.querySelector(`a[href="${productLink}"]`);
            if (linkEl) {
              const nameText = linkEl.textContent?.trim() || '';
              if (nameText.length > 5 && nameText.length < 100) {
                productName = nameText;
              }
            }
          }

          parent = parent.parentElement;
          depth++;
        }

        // 유효한 상품 정보가 있으면 추가
        if (productLink && productPrice && !seenUrls.has(productLink)) {
          seenUrls.add(productLink);

          // ID 추출
          const idMatch = productLink.match(/\/(\d+)/);
          const id = idMatch ? idMatch[1] : `dg-${Date.now()}-${items.length}`;

          // 이름이 없으면 대체 텍스트 사용
          if (!productName) {
            productName = img.alt || `상품 ${id}`;
          }

          items.push({
            id,
            name: productName.substring(0, 100),
            price: productPrice,
            minOrderQuantity: 1,
            thumbnailUrl: src.startsWith('http') ? src : `https://domeggook.com${src}`,
            url: productLink,
            seller: '도매꾹',
            shippingFee: 3000,
            dropshippingAvailable: true,
          });
        }
      });

      return items;
    }, maxItems);

    return products.map((p) => ({
      ...p,
      category,
      crawledAt: new Date(),
    }));
  }

  /**
   * 농수산물 카테고리 검색 (간편 메서드)
   */
  async searchFreshProducts(
    type: 'fruits' | 'vegetables' | 'seafood' | 'meat',
    maxItems: number = 20
  ): Promise<WholesaleCrawlResult> {
    const keywords: Record<string, string> = {
      fruits: '과일 도매',
      vegetables: '채소 도매',
      seafood: '수산물 도매',
      meat: '정육 도매',
    };

    return this.search(keywords[type] || '농산물', { maxItems });
  }

  /**
   * 상품 상세페이지 크롤링 - 상세 이미지들 추출
   * 도매처의 상세페이지 이미지를 그대로 가져옴
   */
  async crawlProductDetail(productUrl: string): Promise<{
    success: boolean;
    detailImages: string[];
    detailHtml: string;
    description: string;
    productName?: string;
    error?: string;
  }> {
    if (!this.page) {
      await this.initialize();
    }

    try {
      console.log(`[DomeggookCrawler] 상세페이지 크롤링: ${productUrl}`);

      // 먼저 메인페이지 방문
      await this.page!.goto(this.baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await randomDelay(1000, 2000);

      // 상세페이지로 이동
      await this.page!.goto(productUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await randomDelay(2000, 3000);

      // URL에서 상품 ID 추출
      const productIdMatch = productUrl.match(/domeggook\.com\/(\d+)/);
      const currentProductId = productIdMatch ? productIdMatch[1] : '';

      // 상세페이지 정보 추출
      const detailData = await this.page!.evaluate((productId) => {
        const detailImages: string[] = [];
        const seenUrls = new Set<string>();

        // 상품명 추출
        let productName = '';
        const nameSelectors = ['h1', '.goods_name', '.item_name', '.prd_name', 'title'];
        for (const sel of nameSelectors) {
          const el = document.querySelector(sel);
          if (el?.textContent?.trim()) {
            const text = el.textContent.trim();
            if (text.length > 5 && text.length < 200 && !text.includes('도매꾹')) {
              productName = text;
              break;
            }
          }
        }

        // 1단계: 메인 상품 이미지 찾기 (상단에 있는 가장 큰 이미지)
        let mainProductImageId = '';
        const allImages = document.querySelectorAll('img');

        for (const img of allImages) {
          const src = img.src || '';
          if (!src.includes('upload/item')) continue;

          const rect = img.getBoundingClientRect();
          const width = img.naturalWidth || img.width;

          // 상단 400px 이내의 큰 이미지 (메인 상품 이미지)
          if (rect.top < 400 && width > 200) {
            const idMatch = src.match(/upload\/item\/\d{4}\/\d{2}\/\d{2}\/(\w{20,})/);
            if (idMatch) {
              mainProductImageId = idMatch[1];
              break;
            }
          }
        }

        // 2단계: 상세 설명 이미지 추출
        // A. 메인 상품 이미지 (domeggook CDN)
        allImages.forEach((img) => {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || '';
          if (!src || seenUrls.has(src)) return;

          // domeggook CDN 이미지
          if (src.includes('upload/item')) {
            if (src.includes('icon') || src.includes('logo') || src.includes('btn') || src.includes('banner')) return;
            if (src.includes('_stt_') || src.includes('_thum')) return;

            // 이미지 ID 추출
            const imageIdMatch = src.match(/upload\/item\/\d{4}\/\d{2}\/\d{2}\/(\w{20,})/);
            const imageId = imageIdMatch ? imageIdMatch[1] : '';

            // 메인 상품과 동일한 이미지만
            if (mainProductImageId && imageId && imageId !== mainProductImageId) {
              return;
            }

            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (width < 100 && height < 100) return;

            seenUrls.add(src);
            detailImages.push(src.startsWith('http') ? src : `https://domeggook.com${src}`);
          }
        });

        // B. 외부 호스팅 상세 이미지 (esmplus, cafe24 등 판매자 이미지)
        // 상세 설명 테이블/영역 내 이미지 찾기
        const detailContainers = document.querySelectorAll(
          'table.lInfoViewNoticeTbl, .goods_desc, .item_desc, [class*="detail"], [class*="desc"]'
        );

        detailContainers.forEach((container) => {
          const imgs = container.querySelectorAll('img');
          imgs.forEach((img) => {
            const src = img.src || img.getAttribute('data-src') || '';
            if (!src || seenUrls.has(src)) return;

            // 아이콘/로고 제외
            if (src.includes('icon') || src.includes('logo') || src.includes('btn')) return;
            if (src.includes('domeggook.com/image/')) return; // 도매꾹 UI 이미지 제외

            // 외부 이미지 호스팅 (판매자 상세 이미지)
            const isExternalDetailImage =
              src.includes('esmplus.com') ||
              src.includes('cafe24.com') ||
              src.includes('godo.co.kr') ||
              src.includes('makeshop.co.kr') ||
              src.includes('smart-editor') ||
              src.includes('se2') ||
              (src.includes('.jpg') || src.includes('.png') || src.includes('.gif'));

            if (isExternalDetailImage) {
              const width = img.naturalWidth || img.width;
              const height = img.naturalHeight || img.height;
              if (width < 100 && height < 100) return;

              seenUrls.add(src);
              detailImages.push(src);
            }
          });
        });

        // 상품 설명 텍스트
        let description = '';
        const descSelectors = ['.goods_desc', '.prd_desc', '.item_info', '.product_info', 'meta[name="description"]'];
        for (const selector of descSelectors) {
          const descEl = document.querySelector(selector);
          if (descEl) {
            if (selector.includes('meta')) {
              description = (descEl as HTMLMetaElement).content || '';
            } else {
              description = descEl.textContent?.trim() || '';
            }
            if (description) break;
          }
        }

        return {
          detailImages,
          detailHtml: '', // HTML은 이미지만 사용하므로 생략
          description,
          productName,
          mainProductImageId,
        };
      }, currentProductId);

      console.log(`[DomeggookCrawler] 상세 이미지 ${detailData.detailImages.length}개 추출`);
      if (detailData.productName) {
        console.log(`[DomeggookCrawler] 상품명: ${detailData.productName}`);
      }

      return {
        success: true,
        ...detailData,
      };
    } catch (error) {
      console.error('[DomeggookCrawler] 상세페이지 크롤링 실패:', error);
      return {
        success: false,
        detailImages: [],
        detailHtml: '',
        description: '',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }
}

// 싱글톤 인스턴스
let crawlerInstance: DomeggookCrawler | null = null;

export function getDomeggookCrawler(): DomeggookCrawler {
  if (!crawlerInstance) {
    crawlerInstance = new DomeggookCrawler();
  }
  return crawlerInstance;
}

export async function closeDomeggookCrawler(): Promise<void> {
  if (crawlerInstance) {
    await crawlerInstance.close();
    crawlerInstance = null;
  }
}

/**
 * Mock 데이터 - 테스트용 농수산물 상품
 */
export function getMockWholesaleProducts(keyword: string = '과일', maxItems: number = 20): WholesaleCrawlResult {
  const mockProducts: Record<string, WholesaleProduct[]> = {
    '과일': [
      {
        id: 'mock-fruit-1',
        name: '제주 감귤 5kg (소과)',
        price: 15000,
        retailPrice: 22000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=300&fit=crop',
        detailImages: [
          'https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=800&fit=crop',
          'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800&h=800&fit=crop',
        ],
        url: 'https://domeggook.com/product/12345',
        seller: '제주농장',
        shippingFee: 3000,
        category: '과일',
        origin: '제주도',
        description: '제주도 직송 감귤입니다. 당도 12brix 이상의 달콤한 감귤만 선별하여 보내드립니다. 비타민C가 풍부하고 새콤달콤한 맛이 일품입니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-fruit-2',
        name: '성주 꿀참외 3kg',
        price: 18000,
        retailPrice: 26000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1571575173700-afb9492e6a50?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/12346',
        seller: '성주농협',
        shippingFee: 3000,
        category: '과일',
        origin: '경북 성주',
        description: '성주 특산 꿀참외. 아삭한 식감과 높은 당도가 자랑입니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-fruit-3',
        name: '충주 사과 5kg (부사)',
        price: 22000,
        retailPrice: 32000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/12347',
        seller: '충주과일농장',
        shippingFee: 3000,
        category: '과일',
        origin: '충북 충주',
        description: '충주 사과. 아삭하고 달콤한 부사 품종입니다. 선물용으로도 좋습니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-fruit-4',
        name: '논산 딸기 1kg (설향)',
        price: 16000,
        retailPrice: 24000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/12348',
        seller: '논산딸기농장',
        shippingFee: 4000,
        category: '과일',
        origin: '충남 논산',
        description: '논산 설향 딸기. 제철 딸기 특유의 달콤함이 가득합니다. 냉장배송으로 신선하게 도착합니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-fruit-5',
        name: '제주 한라봉 3kg',
        price: 25000,
        retailPrice: 38000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/12349',
        seller: '제주한라봉농장',
        shippingFee: 3000,
        category: '과일',
        origin: '제주도',
        description: '제주 한라봉. 새콤달콤한 프리미엄 감귤류입니다. 과즙이 풍부하고 껍질이 잘 벗겨집니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
    ],
    '채소': [
      {
        id: 'mock-veg-1',
        name: '무안 양파 10kg',
        price: 12000,
        retailPrice: 18000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/22345',
        seller: '무안양파농장',
        shippingFee: 3000,
        category: '채소',
        origin: '전남 무안',
        description: '무안 특산 양파. 매운맛이 적고 달콤합니다. 저장성이 좋아 오래 보관 가능합니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-veg-2',
        name: '이천 쌀 10kg (추청)',
        price: 35000,
        retailPrice: 48000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/22346',
        seller: '이천쌀농가',
        shippingFee: 3000,
        category: '쌀/잡곡',
        origin: '경기 이천',
        description: '이천 추청미. 밥맛 좋기로 유명합니다. 2024년 햅쌀입니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-veg-3',
        name: '강원도 감자 10kg',
        price: 15000,
        retailPrice: 22000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82ber5f?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/22347',
        seller: '강원농장',
        shippingFee: 3000,
        category: '채소',
        origin: '강원도',
        description: '강원도 고랭지 감자. 포슬포슬하고 맛있습니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
    ],
    '수산물': [
      {
        id: 'mock-sea-1',
        name: '완도 전복 1kg (중)',
        price: 45000,
        retailPrice: 65000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1559070169-a3077159ee16?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/32345',
        seller: '완도수산',
        shippingFee: 5000,
        category: '수산물',
        origin: '전남 완도',
        description: '완도 활전복. 신선한 상태로 배송됩니다. 횟감, 구이, 죽 다양하게 활용 가능합니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-sea-2',
        name: '통영 굴 1kg',
        price: 18000,
        retailPrice: 28000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1606731219412-19ac0b5e9e83?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/32346',
        seller: '통영굴수산',
        shippingFee: 4000,
        category: '수산물',
        origin: '경남 통영',
        description: '통영 석화굴. 겨울 제철 굴입니다. 굴전, 굴밥 등 다양한 요리에 활용하세요.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
      {
        id: 'mock-sea-3',
        name: '동해 오징어 10마리',
        price: 28000,
        retailPrice: 40000,
        minOrderQuantity: 1,
        thumbnailUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&h=300&fit=crop',
        detailImages: [],
        url: 'https://domeggook.com/product/32347',
        seller: '동해수산',
        shippingFee: 4000,
        category: '수산물',
        origin: '강원 동해',
        description: '동해안 싱싱한 오징어. 회, 구이, 볶음 등 다양하게 활용 가능합니다.',
        dropshippingAvailable: true,
        crawledAt: new Date(),
      },
    ],
  };

  // 키워드에 맞는 데이터 반환
  let products: WholesaleProduct[] = [];

  if (keyword.includes('과일') || keyword.includes('감귤') || keyword.includes('사과') || keyword.includes('딸기')) {
    products = mockProducts['과일'];
  } else if (keyword.includes('채소') || keyword.includes('양파') || keyword.includes('쌀') || keyword.includes('감자')) {
    products = mockProducts['채소'];
  } else if (keyword.includes('수산') || keyword.includes('전복') || keyword.includes('굴') || keyword.includes('오징어')) {
    products = mockProducts['수산물'];
  } else {
    // 전체 데이터
    products = [...mockProducts['과일'], ...mockProducts['채소'], ...mockProducts['수산물']];
  }

  return {
    success: true,
    items: products.slice(0, maxItems),
    totalCount: products.length,
    keyword,
    page: 1,
    source: 'mock',
  };
}
