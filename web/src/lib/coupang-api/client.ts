// 쿠팡 Wing API 클라이언트
// API Key 발급 후 실제 연동 구현

import crypto from 'crypto';
import type {
  CoupangCredentials,
  CoupangOrder,
  CoupangProduct,
  ShipmentInput,
  ShipmentResponse,
  ApiResponse,
  ProductRegistrationResponse,
} from './types';

export class CoupangApiClient {
  private accessKey: string;
  private secretKey: string;
  private vendorId: string;
  private baseUrl = 'https://api-gateway.coupang.com';

  constructor(credentials: CoupangCredentials) {
    this.accessKey = credentials.accessKey;
    this.secretKey = credentials.secretKey;
    this.vendorId = credentials.vendorId;
  }

  /**
   * HMAC 서명 생성
   * 쿠팡 API는 HMAC-SHA256 서명 인증을 사용
   */
  private generateSignature(
    method: string,
    path: string,
    datetime: string
  ): string {
    const message = `${datetime}${method}${path}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');

    return `CEA algorithm=HmacSHA256, access-key=${this.accessKey}, signed-date=${datetime}, signature=${signature}`;
  }

  /**
   * API 요청
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const datetime = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');

    const authorization = this.generateSignature(method, path, datetime);

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Authorization: authorization,
        'X-Requested-By': this.vendorId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coupang API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // ============================================
  // 상품 API
  // ============================================

  /**
   * 상품 등록
   */
  async createProduct(
    product: CoupangProduct
  ): Promise<ProductRegistrationResponse> {
    return this.request<ProductRegistrationResponse>(
      'POST',
      `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`,
      product
    );
  }

  /**
   * 상품 조회
   */
  async getProduct(sellerProductId: string): Promise<ApiResponse<CoupangProduct>> {
    return this.request<ApiResponse<CoupangProduct>>(
      'GET',
      `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`
    );
  }

  /**
   * 상품 목록 조회
   */
  async getProducts(params: {
    nextToken?: string;
    maxPerPage?: number;
    status?: 'APPROVED' | 'PENDING' | 'DENIED';
  }): Promise<ApiResponse<{ data: CoupangProduct[]; nextToken?: string }>> {
    const queryParams = new URLSearchParams();
    if (params.nextToken) queryParams.set('nextToken', params.nextToken);
    if (params.maxPerPage) queryParams.set('maxPerPage', String(params.maxPerPage));
    if (params.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products${query ? `?${query}` : ''}`;

    return this.request('GET', path);
  }

  /**
   * 상품 가격 수정
   */
  async updatePrice(
    vendorItemId: string,
    originalPrice: number,
    salePrice: number
  ): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(
      'PUT',
      `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vendorItemId}/prices/${originalPrice}`,
      { salePrice }
    );
  }

  /**
   * 상품 재고 수정
   */
  async updateStock(
    vendorItemId: string,
    quantity: number
  ): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(
      'PUT',
      `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vendorItemId}/quantities/${quantity}`
    );
  }

  // ============================================
  // 주문 API
  // ============================================

  /**
   * 주문 목록 조회 (발주서)
   */
  async getOrders(params: {
    vendorId: string;
    createdAtFrom?: string; // yyyyMMdd
    createdAtTo?: string;
    status?: string;
    nextToken?: string;
    maxPerPage?: number;
  }): Promise<ApiResponse<{ data: CoupangOrder[]; nextToken?: string }>> {
    const queryParams = new URLSearchParams();
    queryParams.set('vendorId', params.vendorId);
    if (params.createdAtFrom) queryParams.set('createdAtFrom', params.createdAtFrom);
    if (params.createdAtTo) queryParams.set('createdAtTo', params.createdAtTo);
    if (params.status) queryParams.set('status', params.status);
    if (params.nextToken) queryParams.set('nextToken', params.nextToken);
    if (params.maxPerPage) queryParams.set('maxPerPage', String(params.maxPerPage));

    return this.request(
      'GET',
      `/v2/providers/openapi/apis/api/v4/vendors/${params.vendorId}/ordersheets?${queryParams}`
    );
  }

  /**
   * 주문 단건 조회
   */
  async getOrder(
    shipmentBoxId: string
  ): Promise<ApiResponse<CoupangOrder>> {
    return this.request<ApiResponse<CoupangOrder>>(
      'GET',
      `/v2/providers/openapi/apis/api/v4/vendors/${this.vendorId}/ordersheets/${shipmentBoxId}`
    );
  }

  /**
   * 상품 준비중 처리
   */
  async prepareShipment(
    shipmentBoxId: number,
    vendorItemId: number
  ): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(
      'PUT',
      `/v2/providers/openapi/apis/api/v4/vendors/${this.vendorId}/ordersheets/${shipmentBoxId}/items/${vendorItemId}/prepareShipment`
    );
  }

  /**
   * 송장 업로드
   */
  async uploadInvoice(
    shipments: ShipmentInput[]
  ): Promise<ShipmentResponse> {
    return this.request<ShipmentResponse>(
      'POST',
      `/v2/providers/openapi/apis/api/v4/vendors/${this.vendorId}/invoices`,
      shipments
    );
  }

  // ============================================
  // 카테고리 API
  // ============================================

  /**
   * 카테고리 자동 매칭
   */
  async getAutoCategory(productName: string): Promise<ApiResponse<{ categoryId: number }>> {
    return this.request<ApiResponse<{ categoryId: number }>>(
      'GET',
      `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/predict?productName=${encodeURIComponent(productName)}`
    );
  }

  /**
   * 카테고리 목록 조회
   */
  async getCategories(): Promise<ApiResponse<{ categoryId: number; categoryName: string }[]>> {
    return this.request(
      'GET',
      `/v2/providers/seller_api/apis/api/v1/marketplace/meta/categories`
    );
  }

  // ============================================
  // 물류센터 API
  // ============================================

  /**
   * 출고지 목록 조회
   */
  async getOutboundShippingPlaces(): Promise<ApiResponse<{ outboundShippingPlaceCode: string; placeName: string }[]>> {
    return this.request(
      'GET',
      `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/outbound-shipping-places`
    );
  }

  /**
   * 반품지 목록 조회
   */
  async getReturnCenters(): Promise<ApiResponse<{ returnCenterCode: string; centerName: string }[]>> {
    return this.request(
      'GET',
      `/v2/providers/seller_api/apis/api/v1/marketplace/return-shipping-centers`
    );
  }
}

/**
 * API 클라이언트 생성 헬퍼
 */
export function createCoupangClient(credentials: CoupangCredentials): CoupangApiClient {
  return new CoupangApiClient(credentials);
}
