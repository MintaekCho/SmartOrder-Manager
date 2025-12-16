/**
 * 플랫폼 어댑터 공통 타입 정의
 */

// 플랫폼 타입
export type Platform = 'COUPANG' | 'NAVER' | 'SHOP';

// 통합 상품 데이터 (플랫폼 무관)
export interface UnifiedProduct {
  // 기본 정보
  name: string;
  description?: string;
  brand?: string;

  // 카테고리
  categoryCode?: string;
  categoryName?: string;

  // 이미지
  thumbnailUrl?: string;
  images: string[];  // 이미지 URL 배열

  // 가격
  costPrice?: number;      // 원가
  salePrice: number;       // 판매가
  comparePrice?: number;   // 정상가 (할인 전)

  // 재고
  stockQuantity: number;

  // 옵션
  options?: UnifiedProductOption[];

  // 상세 정보
  detailHtml?: string;

  // 상품 고시
  notices?: Record<string, string>;

  // 배송 정보
  deliveryType?: 'FREE' | 'PAID' | 'CONDITIONAL';
  deliveryFee?: number;
  freeShipOverAmount?: number;

  // 기타 속성
  searchTags?: string[];
  adultOnly?: boolean;
}

export interface UnifiedProductOption {
  groupName: string;       // 옵션 그룹명 (예: "색상", "사이즈")
  values: UnifiedOptionValue[];
}

export interface UnifiedOptionValue {
  name: string;           // 옵션값 (예: "레드", "L")
  additionalPrice?: number; // 추가금액
  stockQuantity?: number;   // 옵션별 재고
}

// 옵션 조합
export interface OptionCombination {
  options: { groupName: string; value: string }[];
  price: number;
  stockQuantity: number;
  sku?: string;
}

// 플랫폼 등록 결과
export interface PlatformUploadResult {
  success: boolean;
  platform: Platform;
  platformProductId?: string;
  platformItemId?: string;
  platformUrl?: string;
  message?: string;
  error?: string;
  errorDetail?: string;
}

// 플랫폼 설정
export interface PlatformConfig {
  platform: Platform;
  credentials: Record<string, string>;
  sellerId?: string;
  sellerName?: string;
  userId?: string;        // 업체 담당자 ID (쿠팡 필수)
  outboundCode?: string;  // 출고지 코드
  returnCode?: string;    // 반품지 코드
  contactNumber?: string; // A/S 연락처 (쿠팡 필수)
}

// 카테고리 정보
export interface PlatformCategory {
  code: string;
  name: string;
  fullPath: string;       // 전체 경로 (예: "식품 > 과일 > 사과")
  isLeaf: boolean;        // 최하위 카테고리 여부
  parentCode?: string;
}

// 플랫폼 어댑터 인터페이스
export interface IPlatformAdapter {
  platform: Platform;

  // 설정 확인
  isConfigured(): boolean | Promise<boolean>;

  // 상품 등록
  uploadProduct(
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult>;

  // 상품 수정
  updateProduct(
    platformProductId: string,
    product: UnifiedProduct,
    config: PlatformConfig
  ): Promise<PlatformUploadResult>;

  // 상품 삭제
  deleteProduct(
    platformProductId: string,
    config: PlatformConfig
  ): Promise<boolean>;

  // 카테고리 조회
  getCategories(parentCode?: string): Promise<PlatformCategory[]>;

  // 카테고리 검색
  searchCategories(keyword: string): Promise<PlatformCategory[]>;

  // 상품 고시 정보 템플릿 조회
  getNoticeTemplate(categoryCode: string): Promise<Record<string, string>>;
}
