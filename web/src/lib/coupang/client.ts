import crypto from 'crypto';

// 쿠팡 Wing API 클라이언트
// 공식 문서: https://developers.coupang.com/

const COUPANG_API_URL = 'https://api-gateway.coupang.com';

interface CoupangConfig {
  accessKey: string;
  secretKey: string;
}

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean>;
  body?: object;
}

// HMAC-SHA256 서명 생성
function generateSignature(
  method: string,
  path: string,
  query: string,
  datetime: string,
  secretKey: string
): string {
  // 메시지 구성: datetime + method + path + query (query는 ? 없이)
  const message = datetime + method + path + query;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
  return signature;
}

// Authorization 헤더 생성
function generateAuthorization(
  accessKey: string,
  signature: string,
  datetime: string
): string {
  return `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
}

// 쿠팡 API 날짜 형식 생성 (yymmddTHHMMSSZ - GMT+0)
function getFormattedDatetime(): string {
  const now = new Date();
  const year = String(now.getUTCFullYear()).slice(-2); // 2자리 연도
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// 쿼리 스트링 생성 (? 없이 반환)
function buildQueryString(params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) return '';

  const queryString = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString;
}

export class CoupangClient {
  private accessKey: string;
  private secretKey: string;

  constructor(config?: CoupangConfig) {
    this.accessKey = config?.accessKey || process.env.COUPANG_ACCESS_KEY || '';
    this.secretKey = config?.secretKey || process.env.COUPANG_SECRET_KEY || '';

    if (!this.accessKey || !this.secretKey) {
      console.warn('Coupang API credentials not configured');
    }
  }

  // API 요청 실행
  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, query, body } = options;

    const queryString = buildQueryString(query);
    const datetime = getFormattedDatetime();

    // 서명 생성: GET 요청은 query 포함, POST/PUT은 query 없이
    const signature = generateSignature(method, path, queryString, datetime, this.secretKey);
    const authorization = generateAuthorization(this.accessKey, signature, datetime);

    // URL 구성: query가 있으면 ?를 붙여서 연결
    const fullUrl = queryString
      ? `${COUPANG_API_URL}${path}?${queryString}`
      : `${COUPANG_API_URL}${path}`;

    const headers: Record<string, string> = {
      'Authorization': authorization,
      'Content-Type': 'application/json;charset=UTF-8',
      'X-Requested-By': this.accessKey,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    console.log(`[Coupang API] ${method} ${fullUrl}`);
    console.log(`[Coupang API] datetime: ${datetime}, path: ${path}, query: ${queryString}`);

    const response = await fetch(fullUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Coupang API Error] ${response.status}: ${errorText}`);
      throw new Error(`Coupang API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`[Coupang API Response] Keys:`, Object.keys(data));
    return data as T;
  }

  // ==================== 주문 관련 API ====================

  // 주문 목록 조회
  async getOrders(params: {
    vendorId: string;
    createdAtFrom?: string; // yyyy-MM-dd
    createdAtTo?: string;
    status?: string; // ACCEPT, INSTRUCT, DEPARTURE, DELIVERING, FINAL_DELIVERY
    maxPerPage?: number;
    nextToken?: string;
  }) {
    return this.request<CoupangOrderListResponse>({
      method: 'GET',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${params.vendorId}/ordersheets`,
      query: {
        createdAtFrom: params.createdAtFrom || this.getDefaultDateFrom(),
        createdAtTo: params.createdAtTo || this.getDefaultDateTo(),
        status: params.status || 'ACCEPT',
        maxPerPage: params.maxPerPage || 50,
        ...(params.nextToken && { nextToken: params.nextToken }),
      },
    });
  }

  // 주문 상세 조회
  async getOrderDetail(vendorId: string, shipmentBoxId: number) {
    return this.request<CoupangOrderDetailResponse>({
      method: 'GET',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/ordersheets/${shipmentBoxId}`,
    });
  }

  // ==================== 배송 관련 API ====================

  // 발송 처리 (송장 등록)
  async shipOrder(vendorId: string, data: ShipOrderRequest) {
    return this.request<CoupangBaseResponse>({
      method: 'PUT',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/ordersheets/invoices`,
      body: data,
    });
  }

  // 배송 상태 업데이트
  async updateDeliveryStatus(vendorId: string, shipmentBoxId: number, status: string) {
    return this.request<CoupangBaseResponse>({
      method: 'PUT',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/ordersheets/${shipmentBoxId}/status/${status}`,
    });
  }

  // ==================== 상품 관련 API ====================

  // 상품 등록
  async createProduct(vendorId: string, product: CreateProductRequest) {
    return this.request<CoupangProductResponse>({
      method: 'POST',
      path: `/v2/providers/seller_api/apis/api/v1/vendors/${vendorId}/products`,
      body: product,
    });
  }

  // 상품 상세 조회 (seller-products API에서 sellerProductId로 필터링)
  async getProduct(vendorId: string, sellerProductId: number) {
    return this.request<CoupangProductDetailResponse>({
      method: 'GET',
      path: `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`,
      query: {
        vendorId,
        sellerProductId,
      },
    });
  }

  // 상품 목록 페이징 조회
  async getProducts(params: {
    vendorId: string;
    nextToken?: string;
    maxPerPage?: number;
    sellerProductId?: number;
    status?: string;
  }) {
    return this.request<CoupangProductListResponse>({
      method: 'GET',
      path: `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`,
      query: {
        vendorId: params.vendorId,
        maxPerPage: params.maxPerPage || 50,
        ...(params.nextToken && { nextToken: params.nextToken }),
        ...(params.sellerProductId && { sellerProductId: params.sellerProductId }),
        ...(params.status && { status: params.status }),
      },
    });
  }

  // 상품 삭제
  async deleteProduct(vendorId: string, sellerProductId: number) {
    return this.request<CoupangBaseResponse>({
      method: 'DELETE',
      path: `/v2/providers/seller_api/apis/api/v1/vendors/${vendorId}/products/${sellerProductId}`,
    });
  }

  // 상품 가격/재고 수정
  async updateProductPrice(vendorId: string, data: UpdatePriceRequest) {
    return this.request<CoupangBaseResponse>({
      method: 'PUT',
      path: `/v2/providers/seller_api/apis/api/v1/vendors/${vendorId}/products/price`,
      body: data,
    });
  }

  // ==================== 카테고리 관련 API ====================

  // 전체 카테고리 목록 조회 (트리 구조로 전체 반환)
  // GET /v2/providers/seller_api/apis/api/v1/marketplace/meta/display-categories
  async getAllDisplayCategories() {
    return this.request<CoupangAllCategoriesResponse>({
      method: 'GET',
      path: '/v2/providers/seller_api/apis/api/v1/marketplace/meta/display-categories',
    });
  }

  // 특정 카테고리의 하위 카테고리 조회
  // displayCategoryCode=0 이면 최상위 카테고리 반환
  async getDisplayCategories(displayCategoryCode: number = 0) {
    return this.request<CoupangDisplayCategoriesResponse>({
      method: 'GET',
      path: `/v2/providers/seller_api/apis/api/v1/marketplace/meta/display-categories/${displayCategoryCode}`,
    });
  }

  // 카테고리 메타 정보 조회 (상품고시정보, 옵션, 필수서류 등)
  async getCategoryMeta(displayCategoryCode: number) {
    return this.request<CoupangCategoryMetaResponse>({
      method: 'GET',
      path: `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`,
    });
  }

  // 카테고리 추천 (상품명 기반)
  // POST /v2/providers/openapi/apis/api/v1/categorization/predict
  async predictCategory(productName: string, options?: {
    productDescription?: string;
    brand?: string;
    attributes?: Record<string, string>;
  }) {
    return this.request<CoupangCategoryPredictResponse>({
      method: 'POST',
      path: '/v2/providers/openapi/apis/api/v1/categorization/predict',
      body: {
        productName,
        ...options,
      },
    });
  }

  // ==================== 정산 관련 API ====================

  // 정산 내역 조회
  async getSettlements(params: {
    vendorId: string;
    settleDateFrom: string; // yyyy-MM-dd
    settleDateTo: string;
    nextToken?: string;
    maxPerPage?: number;
  }) {
    return this.request<CoupangSettlementResponse>({
      method: 'GET',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${params.vendorId}/settlements`,
      query: {
        settleDateFrom: params.settleDateFrom,
        settleDateTo: params.settleDateTo,
        maxPerPage: params.maxPerPage || 50,
        ...(params.nextToken && { nextToken: params.nextToken }),
      },
    });
  }

  // ==================== 반품/취소 관련 API ====================

  // 취소 요청 목록 조회
  // 쿠팡 API: status 파라미터 필수 (UC, CC, CR 등)
  // UC: 승인대기, CC: 승인완료, CR: 거절, RC: 수거완료
  async getCancelRequests(params: {
    vendorId: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    cancelType?: string; // CANCEL, RETURN, EXCHANGE
    status?: string; // UC(승인대기), CC(승인완료), CR(거절), RC(수거완료)
    maxPerPage?: number;
    nextToken?: string;
  }) {
    return this.request<CoupangCancelListResponse>({
      method: 'GET',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${params.vendorId}/returnRequests`,
      query: {
        createdAtFrom: params.createdAtFrom || this.getDefaultDateFrom(),
        createdAtTo: params.createdAtTo || this.getDefaultDateTo(),
        status: params.status || 'UC', // 기본값: 승인대기
        maxPerPage: params.maxPerPage || 50,
        ...(params.cancelType && { cancelType: params.cancelType }),
        ...(params.nextToken && { nextToken: params.nextToken }),
      },
    });
  }

  // 취소/반품 승인
  async approveCancel(vendorId: string, receiptId: number) {
    return this.request<CoupangBaseResponse>({
      method: 'PUT',
      path: `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/returnRequests/${receiptId}/approval`,
    });
  }

  // ==================== 출고지/반품지 관련 API ====================

  // 출고지 목록 조회
  // GET /v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound
  async getOutboundShippingPlaces(_vendorId: string, pageNum: number = 1, pageSize: number = 50) {
    return this.request<CoupangOutboundShippingPlacesResponse>({
      method: 'GET',
      path: '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound',
      query: {
        pageNum,
        pageSize,
      },
    });
  }

  // 반품지 목록 조회
  // GET /v2/providers/seller_api/apis/api/v1/vendors/{vendorId}/return-shipping-centers
  async getReturnShippingCenters(vendorId: string, pageNum: number = 1, pageSize: number = 50) {
    return this.request<CoupangReturnShippingCentersResponse>({
      method: 'GET',
      path: `/v2/providers/seller_api/apis/api/v1/vendors/${vendorId}/return-shipping-centers`,
      query: {
        pageNum,
        pageSize,
      },
    });
  }

  // ==================== 유틸리티 메서드 ====================

  private getDefaultDateFrom(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7); // 7일 전
    return date.toISOString().split('T')[0];
  }

  private getDefaultDateTo(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// ==================== 타입 정의 ====================

export interface CoupangBaseResponse {
  code: string;
  message: string;
}

export interface CoupangOrderListResponse extends CoupangBaseResponse {
  data: CoupangOrder[];
  nextToken?: string;
}

export interface CoupangOrder {
  shipmentBoxId: number;
  orderId: number;
  orderedAt: string;
  ordererName: string;
  ordererEmail: string;
  ordererPhone: string;
  receiverName: string;
  receiverPhone: string;
  postCode: string;
  address: string;
  addressDetail: string;
  deliveryMessage: string;
  shippingPrice: number;
  remoteAreaPrice: number;
  splitShipping: boolean;
  ableSplitShipping: boolean;
  orderItems: CoupangOrderItem[];
  status: string;
  paidAt: string;
}

export interface CoupangOrderItem {
  vendorItemId: number;
  vendorItemName: string;
  vendorItemPackageType: string;
  shippingCount: number;
  salesPrice: number;
  orderPrice: number;
  discountPrice: number;
  instantCouponDiscount: number;
  downloadableCouponDiscount: number;
  coupangDiscount: number;
  externalVendorSkuCode: string;
  etcInfoHeader: string;
  etcInfoValue: string;
  sellerProductId: number;
  sellerProductName: string;
  sellerProductItemId: number;
  firstOptionName: string;
  firstOptionValue: string;
  secondOptionName: string;
  secondOptionValue: string;
  cancelCount: number;
}

export interface CoupangOrderDetailResponse extends CoupangBaseResponse {
  data: CoupangOrder;
}

export interface ShipOrderRequest {
  shipmentBoxId: number;
  deliveryCompanyCode: string; // CJGLS, LOTTE, HANJIN, etc.
  invoiceNumber: string;
  splitShipping?: boolean;
  vendorItemIds?: number[];
}

export interface CreateProductRequest {
  // 필수 필드
  displayCategoryCode: number;           // 전시카테고리 코드 (필수)
  sellerProductName: string;             // 등록상품명 (필수)
  vendorId: string;                      // 업체 아이디 (필수)
  saleStartedAt: string;                 // 판매시작일 yyyy-MM-ddTHH:mm:ss (필수)
  saleEndedAt: string;                   // 판매종료일 yyyy-MM-ddTHH:mm:ss (필수)
  brand: string;                         // 브랜드 (필수)
  generalProductName: string;            // 표준 제품명 (필수)
  productGroup: string;                  // 상품그룹 (필수)
  deliveryMethod: string;                // 배송방법: SEQUENCIAL, VENDOR_DIRECT 등 (필수)
  deliveryCompanyCode: string;           // 택배사 코드 (필수)
  deliveryChargeType: string;            // 배송비종류: FREE, NOT_FREE, CHARGE_RECEIVED 등 (필수)
  deliveryCharge: number;                // 기본배송비 (필수)
  freeShipOverAmount: number;            // 조건부무료 기준금액 (필수)
  deliveryChargeOnReturn: number;        // 반품배송비 (필수)
  remoteAreaDeliverable: string;         // 도서산간배송여부: Y, N (필수)
  unionDeliveryType: string;             // 묶음배송: UNION_DELIVERY, NOT_UNION_DELIVERY (필수)
  returnCenterCode: string;              // 반품지 코드 (필수)
  returnCharge: number;                  // 초도반품배송비 (필수)
  returnChargeVendor: string;            // 반품/교환비 청구: VENDOR, BUYER (필수)
  afterServiceInformation: string;       // A/S 안내 (필수)
  afterServiceContactNumber: string;     // A/S 전화번호 (필수)
  outboundShippingPlaceCode: number;     // 출고지 코드 (필수)
  vendorUserId: string;                  // 업체 담당자 아이디 (필수)
  requested: boolean;                    // 승인요청여부 - false: 임시저장, true: 승인요청 (필수)
  items: CreateProductItem[];            // 아이템(옵션) 목록 (필수)

  // 선택 필드
  displayProductName?: string;           // 노출상품명 (고객에게 보이는 이름)
  returnChargeName?: string;             // 수취인명(반품지)
  returnZipCode?: string;                // 반품지 우편번호
  returnAddress?: string;                // 반품지 주소
  returnAddressDetail?: string;          // 반품지 상세주소
  companyContactNumber?: string;         // 업체 연락처
  manufacture?: string;                  // 제조사
  extraInfoMessage?: string;             // 추가 메시지

  // 배열 필드
  requiredDocuments?: RequiredDocument[];  // 필수서류
  contents?: ProductContent[];             // 상세설명
  notices?: ProductNotice[];               // 상품고시정보
  attributes?: ProductAttribute[];         // 구매옵션(속성)

  // 묶음상품
  bundleInfo?: BundleInfo;               // 묶음상품 정보
}

export interface CreateProductItem {
  itemName: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount: number;
  maximumBuyForPerson: number;
  maximumBuyForPersonPeriod: number;
  outboundShippingTimeDay: number;
  unitCount: number;
  adultOnly: string;
  taxType: string;
  parallelImported: string;
  overseasPurchased: string;
  pccNeeded: string;
  externalVendorSku: string;
  barcode: string;
  emptyBarcode: boolean;
  emptyBarcodeReason: string;
  modelNo: string;
  extraProperties: Record<string, string>;
  certifications: Certification[];
  searchTags: string[];
  images: ProductImage[];
  notices: ProductNotice[];
  attributes: ProductAttribute[];
  contents: ProductContent[];
  offerCondition: string;
  offerDescription: string;
}

export interface RequiredDocument {
  templateName: string;
  documentPath: string;
  vendorDocumentPath: string;
}

export interface Certification {
  certificationType: string;
  certificationCode: string;
}

export interface ProductImage {
  imageOrder: number;
  imageType: string;
  cdnPath: string;
  vendorPath: string;
}

export interface ProductNotice {
  noticeCategoryName: string;
  noticeCategoryDetailName: string;
  content: string;
}

export interface ProductAttribute {
  attributeTypeName: string;
  attributeValueName: string;
}

export interface ProductContent {
  contentsType: string;
  contentDetails: ContentDetail[];
}

export interface ContentDetail {
  content: string;
  detailType: string;
}

// 묶음상품 정보
export interface BundleInfo {
  bundleType: string;              // SINGLE_BUNDLE, MULTI_BUNDLE
  bundleQuantity?: number;         // 묶음 수량
}

export interface UpdatePriceRequest {
  sellerProductId: number;
  items: {
    vendorItemId: number;
    originalPrice: number;
    salePrice: number;
  }[];
}

export interface CoupangProductResponse extends CoupangBaseResponse {
  data: {
    sellerProductId: number;
    statusName: string;
    productId: number;
  };
}

// 상품 상세 조회 응답
export interface CoupangProductDetailItem {
  vendorItemId: number;
  vendorItemName: string;
  itemName: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount?: number;
  maximumBuyForPerson?: number;
  outboundShippingTimeDay?: number;
  adultOnly?: string;
  taxType?: string;
  parallelImported?: string;
  overseasPurchased?: string;
  externalVendorSku?: string;
  barcode?: string;
  modelNo?: string;
  unitCount?: number;
  offerCondition?: string;
  images?: ProductImage[];
  searchTags?: string[];
  attributes?: ProductAttribute[];
}

export interface CoupangProductDetailResponse extends CoupangBaseResponse {
  data: {
    sellerProductId: number;
    sellerProductName: string;
    displayCategoryCode: number;
    categoryId?: number;
    productId?: number;
    vendorId?: string;
    saleStartedAt?: string;
    saleEndedAt?: string;
    displayProductName?: string;
    brand?: string;
    generalProductName?: string;
    productGroup?: string;
    statusName: string;
    deliveryMethod?: string;
    deliveryCompanyCode?: string;
    deliveryChargeType?: string;
    deliveryCharge?: number;
    freeShipOverAmount?: number;
    returnCenterCode?: string;
    returnCharge?: number;
    returnChargeVendor?: string;
    afterServiceInformation?: string;
    afterServiceContactNumber?: string;
    outboundShippingPlaceCode?: number;
    manufacture?: string;
    requested?: boolean;
    items?: CoupangProductDetailItem[];
    contents?: ProductContent[];
    notices?: ProductNotice[];
    attributes?: ProductAttribute[];
    extraInfoMessage?: string;
  };
}

// 상품 목록 조회 응답 (seller-products API)
export interface CoupangProductListItem {
  sellerProductId: number;
  sellerProductName: string;
  displayCategoryCode: number;
  categoryId?: number;
  productId?: number;
  vendorId?: string;
  mdId?: string;
  mdName?: string;
  saleStartedAt?: string;
  saleEndedAt?: string;
  displayProductName?: string;
  brand?: string;
  generalProductName?: string;
  productGroup?: string;
  statusName: string; // 승인완료, 승인대기, 판매중지, 임시저장 등
  deliveryMethod?: string;
  deliveryCompanyCode?: string;
  deliveryChargeType?: string;
  deliveryCharge?: number;
  returnCenterCode?: string;
  returnCharge?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoupangProductListResponse extends CoupangBaseResponse {
  data: CoupangProductListItem[];
  nextToken?: string;
}

// 카테고리 목록 조회 응답
export interface CoupangDisplayCategory {
  displayCategoryCode: number;
  displayCategoryName: string;
  isLeaf: boolean; // 최하위 카테고리 여부
  parentDisplayCategoryCode?: number;
}

export interface CoupangDisplayCategoriesResponse extends CoupangBaseResponse {
  data: CoupangDisplayCategory[];
}

// 전체 카테고리 목록 응답 (트리 구조)
export interface CoupangCategoryTreeNode {
  displayItemCategoryCode: number;
  name: string;
  status: string;
  child: CoupangCategoryTreeNode[];
}

export interface CoupangAllCategoriesResponse extends CoupangBaseResponse {
  data: CoupangCategoryTreeNode;
}

// 카테고리 추천 응답
export interface CoupangCategoryPredictResponse extends CoupangBaseResponse {
  data: {
    autoCategorizationPredictionResultType: string; // SINGLE, MULTIPLE, NONE
    predictedCategoryId: string;
    predictedCategoryName: string;
    comment: string | null;
  };
}

// 카테고리 메타 정보 응답
export interface CoupangCategoryMetaResponse extends CoupangBaseResponse {
  data: {
    displayCategoryCode: number;
    displayCategoryName: string;
    wholeCategoryName: string;
    // 상품고시정보 카테고리 목록
    noticeCategories?: {
      noticeCategoryId: string;
      noticeCategoryName: string;
      required: boolean;
      noticeItemNames: string[];
    }[];
    // 필수 옵션 (구매옵션)
    attributes?: {
      attributeTypeName: string;
      required: boolean;
      dataType: string;
      attributeValues?: string[];
    }[];
    // 필수 서류
    requiredDocuments?: {
      templateName: string;
      required: boolean;
    }[];
    // 인증 정보
    certifications?: {
      certificationType: string;
      required: boolean;
    }[];
  };
}

// 참고: 쿠팡 API에서 카테고리 검색/추천 기능은 공식 제공되지 않음
// 대신 getDisplayCategories로 전체 목록을 가져와서 로컬에서 필터링해야 함

export interface CoupangSettlementResponse extends CoupangBaseResponse {
  data: {
    settleDate: string;
    orderId: number;
    productTitle: string;
    optionTitle: string;
    quantity: number;
    salePrice: number;
    couponDiscount: number;
    deliveryCharge: number;
    commission: number;
    settlementAmount: number;
  }[];
  nextToken?: string;
}

export interface CoupangCancelListResponse extends CoupangBaseResponse {
  data: {
    receiptId: number;
    orderId: number;
    cancelType: string;
    cancelReason: string;
    cancelReasonDetail: string;
    createdAt: string;
    status: string;
  }[];
  nextToken?: string;
}

// 출고지 목록 응답
export interface OutboundShippingPlace {
  outboundShippingPlaceCode: number;  // 출고지 코드
  shippingPlaceName: string;          // 출고지 이름
  placeAddresses?: {
    addressType: string;              // ROADNAME, JIBUN
    countryCode: string;
    companyContactNumber?: string;    // 업체 연락처
    phoneNumber2?: string;
    returnZipCode: string;            // 우편번호
    returnAddress: string;            // 주소
    returnAddressDetail?: string;     // 상세주소
  }[];
  remoteAreaDeliverable?: string;     // 도서산간 배송 가능 여부
  usable: boolean;                    // 사용 가능 여부
}

export interface CoupangOutboundShippingPlacesResponse extends CoupangBaseResponse {
  // 새 API는 data 없이 직접 content와 pagination 반환
  content?: OutboundShippingPlace[];
  pagination?: {
    currentPage: number;
    countPerPage: number;
    totalPages: number;
    totalElements: number;
  };
  // 이전 API 호환성
  data?: {
    content: OutboundShippingPlace[];
    pagination: {
      pageNum: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  };
}

// 반품지 목록 응답
export interface ReturnShippingCenter {
  returnCenterCode: string;           // 반품지 코드
  shippingPlaceName: string;          // 반품지 이름
  deliverCode?: string;               // 택배사 코드
  deliverName?: string;               // 택배사 이름
  placeAddresses?: {
    addressType: string;              // ROADNAME, JIBUN
    countryCode: string;
    companyContactNumber?: string;    // 업체 연락처
    phoneNumber2?: string;
    returnZipCode: string;            // 우편번호
    returnAddress: string;            // 주소
    returnAddressDetail?: string;     // 상세주소
  }[];
  usable: boolean;                    // 사용 가능 여부
}

export interface CoupangReturnShippingCentersResponse extends CoupangBaseResponse {
  data: {
    content: ReturnShippingCenter[];
    pagination: {
      pageNum: number;
      pageSize: number;
      totalElements: number;
      totalPages: number;
    };
  };
}

// 택배사 코드
export const DELIVERY_COMPANY_CODES = {
  CJGLS: 'CJ대한통운',
  LOTTE: '롯데택배',
  HANJIN: '한진택배',
  EPOST: '우체국택배',
  KGB: 'KGB택배',
  LOGEN: '로젠택배',
  DAESIN: '대신택배',
  ILYANG: '일양로지스',
  CHUNIL: '천일택배',
  HDEXP: '합동택배',
  CVSNET: 'GS편의점택배',
  CU: 'CU편의점택배',
} as const;

// 배송비 종류
export const DELIVERY_CHARGE_TYPES = {
  FREE: '무료',
  NOT_FREE: '유료',
  CHARGE_RECEIVED: '착불',
  CONDITIONAL_FREE: '조건부 무료',
} as const;

// 배송방법
export const DELIVERY_METHODS = {
  SEQUENCIAL: '일반배송',
  VENDOR_DIRECT: '업체직송',
  MAKE_ORDER: '주문제작',
} as const;

// 묶음배송 타입
export const UNION_DELIVERY_TYPES = {
  UNION_DELIVERY: '묶음배송 가능',
  NOT_UNION_DELIVERY: '묶음배송 불가',
} as const;

// 싱글톤 인스턴스
let clientInstance: CoupangClient | null = null;

export function getCoupangClient(): CoupangClient {
  if (!clientInstance) {
    clientInstance = new CoupangClient();
  }
  return clientInstance;
}
