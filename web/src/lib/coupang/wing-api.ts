/**
 * 쿠팡 Wing API 클라이언트
 *
 * 쿠팡 Wing API를 사용하여 상품 등록/수정/조회를 수행합니다.
 * 실제 사용 시 사업자 등록 및 Wing 판매자 계정이 필요합니다.
 *
 * API 문서: https://developers.coupangcorp.com/hc/ko
 */

import crypto from 'crypto';

export interface CoupangProduct {
  // 기본 정보
  sellerProductId?: string;
  sellerProductName: string;
  displayCategoryCode: number;
  brand: string;
  generalProductName: string;
  productGroup: string;

  // 판매 기간 (PDF 가이드 9페이지)
  saleStartedAt?: string;  // yyyy-MM-ddTHH:mm:ss
  saleEndedAt?: string;    // yyyy-MM-ddTHH:mm:ss

  // 배송 정보 (PDF 가이드 11-12페이지)
  deliveryMethod: 'DIRECT' | 'VENDOR';
  deliveryCompanyCode: string;
  deliveryChargeType: 'FREE' | 'NOT_FREE' | 'CONDITIONAL_FREE' | 'CHARGE_RECEIVED';
  deliveryCharge: number;
  freeShipOverAmount?: number;
  deliveryChargeOnReturn?: number;     // 초도반품배송비
  remoteAreaDeliverable?: 'Y' | 'N';   // 도서산간 배송
  unionDeliveryType?: 'UNION_DELIVERY' | 'NOT_UNION_DELIVERY';  // 묶음배송

  // 반품/교환 정보 (PDF 가이드 13페이지)
  returnCenterCode: string;
  returnCharge: number;
  returnChargeVendor?: 'VENDOR' | 'BUYER';  // 반품비 청구

  // A/S 정보 (PDF 가이드 13페이지)
  afterServiceInformation?: string;
  afterServiceContactNumber?: string;

  // 출고지 및 판매자 정보 (PDF 가이드 9페이지)
  outboundShippingPlaceCode?: string;
  vendorId: string;
  vendorUserId?: string;  // 업체 담당자 ID

  // 승인 요청 (PDF 가이드 27페이지)
  requested?: boolean;  // false: 임시저장, true: 승인요청

  // 기타
  items: CoupangProductItem[];
  requiredDocuments?: RequiredDocument[];
  extraInfoMessage?: string;
  manufacture: string;
  brandId?: number;
}

export interface CoupangProductItem {
  itemName: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount: number;
  maximumBuyForPerson: number;
  maximumBuyForPersonPeriod?: number;  // 구매 제한 기간 (일 단위) - PDF 가이드 14페이지
  outboundShippingTimeDay: number;
  unitCount: number;
  adultOnly: 'ADULT_ONLY' | 'EVERYONE';
  taxType: 'TAX' | 'FREE';
  parallelImported: 'NOT_PARALLEL_IMPORTED' | 'PARALLEL_IMPORTED';
  overseasPurchased: 'NOT_OVERSEAS_PURCHASED' | 'OVERSEAS_PURCHASED';
  pccNeeded: boolean;
  externalVendorSku: string;
  barcode?: string;
  emptyBarcode?: boolean;              // 바코드 미등록 여부
  emptyBarcodeReason?: string;         // 바코드 미등록 사유
  modelNo?: string;                    // 모델번호
  stockQuantity?: number;              // 재고 수량
  images: {
    imageOrder: number;
    imageType: 'REPRESENTATION' | 'DETAIL';
    vendorPath: string;
  }[];
  notices: {
    noticeCategoryName: string;
    noticeCategoryDetailName: string;
    content: string;
  }[];
  certifications?: {
    certificationType: string;         // 인증 타입 (NOT_REQUIRED, KC, etc.)
    certificationCode: string;         // 인증 번호
  }[];
  attributes?: {
    attributeTypeName: string;
    attributeValueName: string;
  }[];
  contents?: {
    contentsType: 'HTML' | 'IMAGE' | 'TEXT';
    contentDetails: {
      content: string;
      detailType?: string;
    }[];
  }[];
  offerCondition: 'NEW' | 'REFURBISHED';
  offerDescription?: string;
  searchTags?: string[];
}

export interface RequiredDocument {
  templateName: string;
  vendorDocumentPath: string;
}

export interface CoupangApiResponse<T = any> {
  code: string;
  message: string;
  data?: T;
}

export interface ProductRegistrationResult {
  success: boolean;
  sellerProductId?: string;
  message: string;
  error?: string;
}

export class CoupangWingClient {
  private accessKey: string;
  private secretKey: string;
  private vendorId: string;
  private baseUrl = 'https://api-gateway.coupang.com';

  constructor(accessKey: string, secretKey: string, vendorId: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.vendorId = vendorId;
  }

  /**
   * API 설정 여부 확인
   */
  isConfigured(): boolean {
    return !!(this.accessKey && this.secretKey && this.vendorId);
  }

  /**
   * VendorId getter
   */
  getVendorId(): string {
    return this.vendorId;
  }

  /**
   * HMAC 서명 생성
   */
  private generateSignature(method: string, path: string, datetime: string): string {
    const message = `${datetime}${method}${path}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');
    return signature;
  }

  /**
   * API 요청 헤더 생성
   */
  private getHeaders(method: string, path: string): Record<string, string> {
    const datetime = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const signature = this.generateSignature(method, path, datetime);

    return {
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.accessKey}, signed-date=${datetime}, signature=${signature}`,
    };
  }

  /**
   * 상품 등록
   */
  async registerProduct(product: CoupangProduct): Promise<ProductRegistrationResult> {
    if (!this.isConfigured()) {
      // Mock 응답 반환 (테스트용)
      return this.getMockRegistrationResult(product);
    }

    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders('POST', path),
        body: JSON.stringify(product),
      });

      const result: CoupangApiResponse = await response.json();

      if (result.code === 'SUCCESS') {
        return {
          success: true,
          sellerProductId: result.data?.sellerProductId,
          message: '상품이 성공적으로 등록되었습니다.',
        };
      } else {
        return {
          success: false,
          message: result.message || '상품 등록에 실패했습니다.',
          error: result.code,
        };
      }
    } catch (error) {
      console.error('[CoupangWing] 상품 등록 오류:', error);
      return {
        success: false,
        message: '상품 등록 중 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 상품 조회
   */
  async getProduct(sellerProductId: string): Promise<CoupangApiResponse> {
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders('GET', path),
      });

      return await response.json();
    } catch (error) {
      console.error('[CoupangWing] 상품 조회 오류:', error);
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 카테고리 조회
   */
  async getCategories(categoryCode?: number): Promise<CoupangApiResponse> {
    const path = categoryCode
      ? `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${categoryCode}`
      : `/v2/providers/seller_api/apis/api/v1/marketplace/meta/categories`;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders('GET', path),
      });

      return await response.json();
    } catch (error) {
      console.error('[CoupangWing] 카테고리 조회 오류:', error);
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Mock 등록 결과 (테스트용)
   */
  private getMockRegistrationResult(product: CoupangProduct): ProductRegistrationResult {
    const mockId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('[CoupangWing] Mock 등록:', {
      productName: product.sellerProductName,
      mockId,
    });

    return {
      success: true,
      sellerProductId: mockId,
      message: '[테스트] 상품이 Mock으로 등록되었습니다. 실제 등록을 위해서는 Wing API 인증 정보가 필요합니다.',
    };
  }
}

// DB에서 설정을 로드하여 Wing 클라이언트 생성
export async function getCoupangWingClientFromDB(): Promise<CoupangWingClient | null> {
  try {
    const { getOrCreateDefaultUserId } = await import('@/lib/auth');
    const { prisma } = await import('@/lib/prisma');
    const userId = await getOrCreateDefaultUserId();

    const config = await prisma.platformConfig.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: 'COUPANG',
        },
      },
    });

    if (!config || !config.isActive) {
      console.warn(`[CoupangWingClient] No active config for user ${userId}`);
      return null;
    }

    const credentials = config.credentials as Record<string, string>;
    const { accessKey, secretKey, vendorId } = credentials;

    if (!accessKey || !secretKey || !vendorId) {
      console.warn(`[CoupangWingClient] Missing credentials for user ${userId}`);
      return null;
    }

    return new CoupangWingClient(accessKey, secretKey, vendorId);
  } catch (error) {
    console.error('[CoupangWingClient] Error loading from DB:', error);
    return null;
  }
}

// 싱글톤 인스턴스 캐시
const wingClientCache = new Map<string, CoupangWingClient>();

export async function getCoupangWingClient(): Promise<CoupangWingClient> {
  const { getOrCreateDefaultUserId } = await import('@/lib/auth');
  const userId = await getOrCreateDefaultUserId();

  // 캐시 확인
  const cached = wingClientCache.get(userId);
  if (cached) {
    return cached;
  }

  // DB에서 설정 로드
  const client = await getCoupangWingClientFromDB();
  if (!client) {
    throw new Error('쿠팡 API 설정이 없습니다. 설정 페이지에서 API 키를 입력해주세요.');
  }

  wingClientCache.set(userId, client);
  return client;
}

/**
 * 농수산물 카테고리 코드 (쿠팡)
 */
export const COUPANG_FRESH_CATEGORIES = {
  // 식품
  fruits: 76001, // 과일
  vegetables: 76002, // 채소
  rice: 76003, // 쌀/잡곡
  seafood: 76004, // 수산물
  meat: 76005, // 정육/계란
  kimchi: 76006, // 김치/반찬
};

/**
 * 농수산물 상품고시 템플릿
 */
export function getFreshProductNotices(params: {
  productName: string;
  origin: string;
  weight: string;
  expiryDate?: string;
}): CoupangProductItem['notices'] {
  return [
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '포장단위별 용량(중량), 수량',
      content: params.weight,
    },
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '원산지',
      content: params.origin,
    },
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '제조연월일, 소비기한 또는 품질유지기한',
      content: params.expiryDate || '수확일로부터 2주 이내 소비 권장',
    },
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '농수산물의 명칭',
      content: params.productName,
    },
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '보관방법 또는 취급방법',
      content: '서늘하고 건조한 곳에 보관, 세척 후 섭취',
    },
    {
      noticeCategoryName: '식품(농산물)',
      noticeCategoryDetailName: '생산자, 수입품의 경우 수입자를 함께 표기',
      content: '판매자 정보 참조',
    },
  ];
}
