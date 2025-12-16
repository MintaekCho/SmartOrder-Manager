/**
 * Naver Commerce API 타입 정의
 * API 문서: https://apicenter.commerce.naver.com/
 */

// ============================================
// 인증 관련 타입
// ============================================

export interface NaverCredentials {
  clientId: string;     // 애플리케이션 ID
  clientSecret: string; // 애플리케이션 Secret
}

export interface NaverTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// ============================================
// 상품 등록 관련 타입
// ============================================

export interface NaverProductRequest {
  originProduct: NaverOriginProduct;
}

export interface NaverOriginProduct {
  statusType: 'SALE' | 'WAIT' | 'OUTOFSTOCK' | 'UNADMISSION' | 'REJECTION' | 'SUSPENSION' | 'CLOSE' | 'DELETE';
  saleType: 'NEW' | 'OLD';
  leafCategoryId: string;  // 최하위 카테고리 ID
  name: string;            // 상품명 (최대 100자)
  images: NaverProductImage;
  detailContent: string;   // 상세 설명 (HTML)
  salePrice: number;       // 판매가
  stockQuantity: number;   // 재고 수량
  deliveryInfo: NaverDeliveryInfo;
  detailAttribute?: NaverDetailAttribute;
  customerBenefit?: NaverCustomerBenefit;
  productInfoProvidedNotice?: NaverProductInfoNotice; // 상품정보 제공고시
  optionInfo?: NaverOptionInfo;
}

export interface NaverProductImage {
  representativeImage: {
    url: string;  // 대표 이미지 URL
  };
  optionalImages?: {
    url: string;
  }[];
}

export interface NaverDeliveryInfo {
  deliveryType: 'DELIVERY' | 'DIRECT' | 'VISIT' | 'NOTHING' | 'RESERVATION';
  deliveryAttributeType: 'NORMAL' | 'TODAY' | 'COLD' | 'FRESH' | 'MAKEUP';
  deliveryFee: {
    deliveryFeeType: 'FREE' | 'PAID' | 'CONDITIONAL_FREE' | 'QUANTITY_CONDITIONAL_FREE';
    baseFee?: number;           // 기본 배송비
    freeConditionalAmount?: number; // 무료배송 조건금액
    deliveryFeeByArea?: {
      deliveryAreaType: 'AREA_2' | 'AREA_3';  // 제주/도서산간
      area2extraFee?: number;
      area3extraFee?: number;
    };
  };
  claimDeliveryInfo?: {
    returnDeliveryFee: number;   // 반품 배송비
    exchangeDeliveryFee: number; // 교환 배송비
    shippingAddressId?: number;  // 출고지 ID
    returnAddressId?: number;    // 반품지 ID
  };
}

export interface NaverDetailAttribute {
  naverShoppingSearchInfo?: {
    manufacturerName?: string;   // 제조사
    brandName?: string;          // 브랜드명
    modelName?: string;          // 모델명
  };
  afterServiceInfo?: {
    afterServiceTelephoneNumber?: string;
    afterServiceGuideContent?: string;
  };
  originAreaInfo?: {
    originAreaCode?: string;     // 원산지 코드
    content?: string;            // 원산지 상세
    plural?: boolean;            // 복수 원산지
  };
  minorPurchasable?: boolean;    // 미성년자 구매 가능
  seoInfo?: {
    pageTitle?: string;
    metaDescription?: string;
    sellerTags?: { code: number; text: string }[];
  };
}

export interface NaverCustomerBenefit {
  immediateDiscountPolicy?: {
    discountMethod: {
      value: number;
      unitType: 'WON' | 'PERCENT';
    };
  };
  purchasePointPolicy?: {
    value: number;
    unitType: 'WON' | 'PERCENT';
  };
}

export interface NaverProductInfoNotice {
  productInfoProvidedNoticeType: string; // 예: 'WEAR', 'FOOD', 'COSMETIC' 등
  // 각 타입별로 다른 필드 구조를 가짐
  [key: string]: any;
}

// ============================================
// 옵션 관련 타입
// ============================================

export interface NaverOptionInfo {
  simpleOptionSortType?: 'CREATE' | 'ABC' | 'LOW_PRICE' | 'HIGH_PRICE';
  optionSimple?: NaverOptionSimple[];
  optionCustom?: NaverOptionCustom[];
  optionCombinations?: NaverOptionCombination[];
  optionCombinationSortType?: 'CREATE' | 'ABC' | 'LOW_PRICE' | 'HIGH_PRICE';
  optionCombinationGroupNames?: {
    optionGroupName1?: string;
    optionGroupName2?: string;
    optionGroupName3?: string;
    optionGroupName4?: string;
  };
  useStockManagement?: boolean;
  optionDeliveryAttributes?: string[];
}

export interface NaverOptionSimple {
  id?: number;
  groupName: string;      // 옵션 그룹명 (예: "색상")
  name: string;           // 옵션값 (예: "레드")
  usable?: boolean;
}

export interface NaverOptionCustom {
  id?: number;
  groupName: string;
  name: string;
  usable?: boolean;
}

export interface NaverOptionCombination {
  id?: number;
  optionName1: string;            // 첫 번째 옵션값
  optionName2?: string;           // 두 번째 옵션값
  optionName3?: string;           // 세 번째 옵션값
  optionName4?: string;           // 네 번째 옵션값
  stockQuantity: number;          // 재고 수량
  price: number;                  // 옵션 가격 (추가금액 아님, 최종 가격)
  sellerManagerCode?: string;     // 판매자 관리코드
  usable?: boolean;
}

// ============================================
// API 응답 타입
// ============================================

export interface NaverApiResponse<T = any> {
  timestamp: string;
  traceId: string;
  code?: string;
  message?: string;
  data?: T;
}

export interface NaverProductCreateResponse {
  originProductNo: number;        // 원본 상품번호
  smartstoreChannelProductNo: number; // 스마트스토어 상품번호
  windowProductNo?: number;       // 쇼핑윈도 상품번호
}

export interface NaverProductSearchResult {
  contents: NaverProductSummary[];
  totalCount: number;
  page: number;
  size: number;
}

export interface NaverProductSummary {
  originProductNo: number;
  channelProductNo: number;
  productName: string;
  salePrice: number;
  stockQuantity: number;
  statusType: string;
  channelProductDisplayStatusType: string;
  regDate: string;
  modifiedDate: string;
}

// ============================================
// 카테고리 관련 타입
// ============================================

export interface NaverCategory {
  id: string;
  name: string;
  parentId?: string;
  wholeCategoryName: string;  // 전체 카테고리 경로 (예: "식품>과일>사과")
  isLeaf: boolean;            // 최하위 카테고리 여부
}

export interface NaverCategoryAttribute {
  attributeId: number;
  attributeName: string;
  required: boolean;
  attributeValueList?: {
    attributeValueId: number;
    attributeValueName: string;
  }[];
}

// ============================================
// 배송 관련 타입
// ============================================

export interface NaverDeliveryCompany {
  deliveryCompanyId: string;
  deliveryCompanyName: string;
}

export interface NaverShippingAddress {
  id: number;
  name: string;
  addressType: string;
  baseAddress: string;
  detailAddress: string;
  zipCode: string;
  contactNumber1: string;
  isDefault: boolean;
}

// ============================================
// 에러 타입
// ============================================

export interface NaverApiError {
  timestamp: string;
  traceId: string;
  code: string;
  message: string;
  invalidInputs?: {
    field: string;
    message: string;
  }[];
}
