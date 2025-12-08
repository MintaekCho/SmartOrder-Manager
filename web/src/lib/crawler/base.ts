// 크롤러 기본 클래스
// Playwright 설치 후 구현 예정

import type {
  SupplierAdapter,
  SearchParams,
  SearchResult,
  SupplierProductDetail,
  CrawlerConfig,
} from './types';

export abstract class BaseCrawler implements SupplierAdapter {
  abstract readonly name: string;
  abstract readonly code: string;
  abstract readonly baseUrl: string;

  protected config: CrawlerConfig;

  constructor(config: CrawlerConfig = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...config,
    };
  }

  abstract search(params: SearchParams): Promise<SearchResult>;
  abstract getProduct(productId: string): Promise<SupplierProductDetail>;

  // 유틸리티 메서드
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected parsePrice(priceStr: string): number {
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
  }

  protected buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }
}

// Mock 크롤러 (개발/테스트용)
export class MockCrawler extends BaseCrawler {
  readonly name = 'Mock 도매처';
  readonly code = 'MOCK';
  readonly baseUrl = 'https://mock-supplier.example.com';

  async search(params: SearchParams): Promise<SearchResult> {
    // 개발 중 테스트용 mock 데이터
    const mockProducts = [
      {
        id: 'mock-001',
        name: `${params.query} 상품 1`,
        price: 15000,
        thumbnailUrl: 'https://via.placeholder.com/200',
        category: '전자기기',
        salesCount: 150,
        url: `${this.baseUrl}/product/mock-001`,
      },
      {
        id: 'mock-002',
        name: `${params.query} 상품 2`,
        price: 23000,
        thumbnailUrl: 'https://via.placeholder.com/200',
        category: '생활용품',
        salesCount: 89,
        url: `${this.baseUrl}/product/mock-002`,
      },
      {
        id: 'mock-003',
        name: `${params.query} 상품 3`,
        price: 8500,
        thumbnailUrl: 'https://via.placeholder.com/200',
        category: '전자기기',
        salesCount: 230,
        url: `${this.baseUrl}/product/mock-003`,
      },
    ];

    return {
      items: mockProducts,
      total: mockProducts.length,
      page: params.page || 1,
      hasMore: false,
    };
  }

  async getProduct(productId: string): Promise<SupplierProductDetail> {
    return {
      id: productId,
      name: `Mock 상품 ${productId}`,
      price: 15000,
      thumbnailUrl: 'https://via.placeholder.com/400',
      url: `${this.baseUrl}/product/${productId}`,
      description: '이것은 테스트용 상품 설명입니다.',
      images: [
        'https://via.placeholder.com/800x800',
        'https://via.placeholder.com/800x800',
      ],
      options: [
        {
          name: '색상',
          values: [
            { name: '블랙', priceAdjust: 0 },
            { name: '화이트', priceAdjust: 0 },
            { name: '레드', priceAdjust: 1000 },
          ],
        },
      ],
      shippingFee: 3000,
      minOrderQuantity: 1,
    };
  }
}
