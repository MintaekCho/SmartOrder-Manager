// 쿠팡 상품 크롤러
// Playwright 설치 후 실제 크롤링 구현

import { BaseCrawler } from './base';
import type {
  SearchParams,
  SearchResult,
  SupplierProductDetail,
} from './types';

// 쿠팡 상품 타입 (확장)
export interface CoupangProduct {
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
  category: string;
  salesRank?: number;
}

export interface CoupangSearchResult {
  items: CoupangProduct[];
  total: number;
  page: number;
  hasMore: boolean;
  category: string;
}

// 농수산물 카테고리 ID
export const FRESH_CATEGORIES = {
  // 과일
  FRUITS: {
    id: '393760',
    name: '과일',
    subcategories: {
      APPLE: { id: '393761', name: '사과' },
      PEAR: { id: '393762', name: '배' },
      GRAPE: { id: '393763', name: '포도' },
      PEACH: { id: '393764', name: '복숭아' },
      WATERMELON: { id: '393765', name: '수박' },
      MELON: { id: '393766', name: '멜론' },
      STRAWBERRY: { id: '393767', name: '딸기' },
      ORANGE: { id: '393768', name: '오렌지/감귤' },
      BANANA: { id: '393769', name: '바나나' },
      CHERRY: { id: '393770', name: '체리' },
      MANGO: { id: '393771', name: '망고' },
    },
  },
  // 채소
  VEGETABLES: {
    id: '393780',
    name: '채소',
    subcategories: {
      LETTUCE: { id: '393781', name: '상추/샐러드' },
      TOMATO: { id: '393782', name: '토마토' },
      PEPPER: { id: '393783', name: '고추/피망' },
      ONION: { id: '393784', name: '양파/파' },
      GARLIC: { id: '393785', name: '마늘/생강' },
      POTATO: { id: '393786', name: '감자/고구마' },
      MUSHROOM: { id: '393787', name: '버섯' },
    },
  },
  // 수산물
  SEAFOOD: {
    id: '393800',
    name: '수산물',
    subcategories: {
      FISH: { id: '393801', name: '생선' },
      SHRIMP: { id: '393802', name: '새우/게' },
      SHELLFISH: { id: '393803', name: '조개/굴' },
      SQUID: { id: '393804', name: '오징어/문어' },
      DRIED: { id: '393805', name: '건어물' },
    },
  },
  // 정육
  MEAT: {
    id: '393820',
    name: '정육',
    subcategories: {
      BEEF: { id: '393821', name: '소고기' },
      PORK: { id: '393822', name: '돼지고기' },
      CHICKEN: { id: '393823', name: '닭고기' },
    },
  },
};

/**
 * 쿠팡 크롤러
 */
export class CoupangCrawler extends BaseCrawler {
  readonly name = '쿠팡';
  readonly code = 'COUPANG';
  readonly baseUrl = 'https://www.coupang.com';

  /**
   * 카테고리별 베스트셀러 조회
   */
  async getBestSellers(
    categoryId: string,
    page: number = 1
  ): Promise<CoupangSearchResult> {
    // TODO: Playwright로 실제 크롤링 구현
    // 1. 카테고리 페이지 접속
    // 2. 베스트 정렬로 변경
    // 3. 상품 목록 파싱

    console.log(`[쿠팡] 베스트셀러 조회: 카테고리 ${categoryId}, 페이지 ${page}`);

    // Mock 데이터 반환
    return this.getMockBestSellers(categoryId);
  }

  /**
   * 상품 검색
   */
  async search(params: SearchParams): Promise<SearchResult> {
    console.log(`[쿠팡] 검색: ${params.query}`);

    // TODO: 실제 구현
    return {
      items: [],
      total: 0,
      page: params.page || 1,
      hasMore: false,
    };
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(productId: string): Promise<SupplierProductDetail> {
    console.log(`[쿠팡] 상품 조회: ${productId}`);
    throw new Error('Not implemented');
  }

  /**
   * 상품 상세 정보 (쿠팡 전용)
   */
  async getProductDetail(productId: string): Promise<CoupangProduct | null> {
    // TODO: 상품 상세 페이지 크롤링
    console.log(`[쿠팡] 상품 상세: ${productId}`);
    return null;
  }

  /**
   * Mock 베스트셀러 데이터
   */
  private getMockBestSellers(categoryId: string): CoupangSearchResult {
    const mockProducts: CoupangProduct[] = [
      {
        id: 'cp-001',
        name: '성주 꿀참외 2kg (4-8과)',
        price: 15900,
        originalPrice: 19900,
        discountRate: 20,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-001`,
        rating: 4.7,
        reviewCount: 12543,
        isRocketDelivery: true,
        isRocketFresh: true,
        isFreeShipping: true,
        seller: '로켓프레시',
        category: '과일',
        salesRank: 1,
      },
      {
        id: 'cp-002',
        name: '제주 감귤 3kg 소과',
        price: 12900,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-002`,
        rating: 4.5,
        reviewCount: 8920,
        isRocketDelivery: true,
        isRocketFresh: true,
        isFreeShipping: true,
        seller: '로켓프레시',
        category: '과일',
        salesRank: 2,
      },
      {
        id: 'cp-003',
        name: '국내산 바나나 1.2kg',
        price: 6900,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-003`,
        rating: 4.6,
        reviewCount: 15230,
        isRocketDelivery: true,
        isRocketFresh: true,
        isFreeShipping: true,
        seller: '로켓프레시',
        category: '과일',
        salesRank: 3,
      },
      {
        id: 'cp-004',
        name: '충남 금산 인삼 수삼 750g',
        price: 28900,
        originalPrice: 35000,
        discountRate: 17,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-004`,
        rating: 4.4,
        reviewCount: 3240,
        isRocketDelivery: false,
        isRocketFresh: false,
        isFreeShipping: true,
        seller: '금산인삼농장',
        category: '채소',
        salesRank: 4,
      },
      {
        id: 'cp-005',
        name: '완도 활전복 1kg (중/10-12미)',
        price: 32000,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-005`,
        rating: 4.8,
        reviewCount: 5670,
        isRocketDelivery: false,
        isRocketFresh: false,
        isFreeShipping: true,
        seller: '완도수산',
        category: '수산물',
        salesRank: 5,
      },
      {
        id: 'cp-006',
        name: '국내산 한우 1++ 등심 300g',
        price: 45900,
        originalPrice: 52000,
        discountRate: 12,
        thumbnailUrl: 'https://via.placeholder.com/200',
        url: `${this.baseUrl}/vp/products/cp-006`,
        rating: 4.9,
        reviewCount: 9870,
        isRocketDelivery: true,
        isRocketFresh: true,
        isFreeShipping: true,
        seller: '로켓프레시',
        category: '정육',
        salesRank: 6,
      },
    ];

    return {
      items: mockProducts,
      total: mockProducts.length,
      page: 1,
      hasMore: true,
      category: categoryId,
    };
  }
}

/**
 * 시즌 과일 정보
 */
export const SEASONAL_FRUITS: Record<number, string[]> = {
  1: ['딸기', '한라봉', '천혜향'],
  2: ['딸기', '한라봉', '천혜향'],
  3: ['딸기', '한라봉'],
  4: ['딸기', '참외'],
  5: ['참외', '수박', '체리'],
  6: ['참외', '수박', '체리', '복숭아'],
  7: ['수박', '복숭아', '포도', '자두'],
  8: ['수박', '복숭아', '포도', '자두', '배'],
  9: ['포도', '배', '사과'],
  10: ['배', '사과', '감', '귤'],
  11: ['사과', '감', '귤', '배'],
  12: ['귤', '사과', '딸기', '한라봉'],
};

/**
 * 현재 제철 과일 조회
 */
export function getCurrentSeasonalFruits(): string[] {
  const month = new Date().getMonth() + 1;
  return SEASONAL_FRUITS[month] || [];
}
