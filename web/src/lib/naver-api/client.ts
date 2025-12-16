/**
 * Naver Commerce API 클라이언트
 *
 * 네이버 스마트스토어 상품 등록/수정/조회를 위한 API 클라이언트
 * API 문서: https://apicenter.commerce.naver.com/
 */

import crypto from 'crypto';
import type {
  NaverCredentials,
  NaverTokenResponse,
  NaverApiResponse,
  NaverProductRequest,
  NaverProductCreateResponse,
  NaverProductSearchResult,
  NaverCategory,
  NaverShippingAddress,
  NaverApiError,
} from './types';

export class NaverCommerceClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.commerce.naver.com';

  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials?: NaverCredentials) {
    this.clientId = credentials?.clientId || process.env.NAVER_COMMERCE_CLIENT_ID || '';
    this.clientSecret = credentials?.clientSecret || process.env.NAVER_COMMERCE_CLIENT_SECRET || '';
  }

  /**
   * API 설정 여부 확인
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * bcrypt 서명 생성
   * 네이버 Commerce API는 timestamp_clientId_clientSecret 형식의 서명 필요
   */
  private generateSignature(timestamp: number): string {
    // clientSecret을 bcrypt로 해싱 (password + timestamp_clientId 조합)
    // 실제로는 HMAC-SHA256 사용
    const message = `${this.clientId}_${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(message)
      .digest('base64');
    return signature;
  }

  /**
   * OAuth 토큰 발급
   */
  private async getAccessToken(): Promise<string> {
    // 토큰이 유효하면 재사용
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp);

    // bcrypt 해싱된 client_secret_sign 생성
    // 네이버 API는 timestamp + clientId를 clientSecret으로 HMAC-SHA256 해싱
    const clientSecretSign = `${timestamp}.${signature}`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      timestamp: timestamp.toString(),
      client_secret_sign: clientSecretSign,
      grant_type: 'client_credentials',
      type: 'SELF',
    });

    try {
      const response = await fetch(`${this.baseUrl}/external/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token error: ${response.status} - ${errorText}`);
      }

      const data: NaverTokenResponse = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('[NaverCommerce] 토큰 발급 오류:', error);
      throw error;
    }
  }

  /**
   * API 요청 실행
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<NaverApiResponse<T>> {
    const token = await this.getAccessToken();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        const apiError = data as NaverApiError;
        console.error('[NaverCommerce] API 오류:', apiError);
        throw new Error(`API Error: ${apiError.code} - ${apiError.message}`);
      }

      return data;
    } catch (error) {
      console.error(`[NaverCommerce] 요청 실패 (${method} ${path}):`, error);
      throw error;
    }
  }

  // ============================================
  // 상품 API
  // ============================================

  /**
   * 상품 등록 (v2 API)
   */
  async createProduct(product: NaverProductRequest): Promise<NaverProductCreateResponse> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverProductCreateResponse>(
      'POST',
      '/external/v2/products',
      product
    );

    return response.data!;
  }

  /**
   * 상품 수정 (v2 API)
   */
  async updateProduct(
    productNo: number,
    product: NaverProductRequest
  ): Promise<NaverProductCreateResponse> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverProductCreateResponse>(
      'PUT',
      `/external/v2/products/origin-products/${productNo}`,
      product
    );

    return response.data!;
  }

  /**
   * 상품 조회 (v2 API)
   */
  async getProduct(productNo: number): Promise<NaverProductRequest | null> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    try {
      const response = await this.request<NaverProductRequest>(
        'GET',
        `/external/v2/products/origin-products/${productNo}`
      );
      return response.data || null;
    } catch {
      return null;
    }
  }

  /**
   * 상품 목록 검색 (v2 API)
   */
  async searchProducts(params: {
    productStatusTypes?: string[];  // SALE, WAIT, OUTOFSTOCK 등
    page?: number;
    size?: number;
  }): Promise<NaverProductSearchResult> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverProductSearchResult>(
      'POST',
      '/external/v2/products/search',
      {
        productStatusTypes: params.productStatusTypes || ['SALE'],
        page: params.page || 1,
        size: params.size || 10,
      }
    );

    return response.data!;
  }

  /**
   * 상품 삭제 (v2 API)
   */
  async deleteProduct(productNo: number): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    try {
      await this.request(
        'DELETE',
        `/external/v2/products/origin-products/${productNo}`
      );
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // 카테고리 API
  // ============================================

  /**
   * 카테고리 목록 조회
   */
  async getCategories(parentId?: string): Promise<NaverCategory[]> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const path = parentId
      ? `/external/v1/categories/${parentId}/children`
      : '/external/v1/categories';

    const response = await this.request<NaverCategory[]>('GET', path);
    return response.data || [];
  }

  /**
   * 카테고리 검색 (키워드)
   */
  async searchCategories(keyword: string): Promise<NaverCategory[]> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverCategory[]>(
      'GET',
      `/external/v1/categories/search?query=${encodeURIComponent(keyword)}`
    );

    return response.data || [];
  }

  // ============================================
  // 배송/물류 API
  // ============================================

  /**
   * 출고지 목록 조회
   */
  async getShippingAddresses(): Promise<NaverShippingAddress[]> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverShippingAddress[]>(
      'GET',
      '/external/v1/seller/shipping-addresses'
    );

    return response.data || [];
  }

  /**
   * 반품지 목록 조회
   */
  async getReturnAddresses(): Promise<NaverShippingAddress[]> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<NaverShippingAddress[]>(
      'GET',
      '/external/v1/seller/return-addresses'
    );

    return response.data || [];
  }

  // ============================================
  // 주문 API
  // ============================================

  /**
   * 주문 목록 조회
   */
  async getOrders(params: {
    orderStatus?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Promise<{ contents: unknown[]; totalCount: number }> {
    if (!this.isConfigured()) {
      throw new Error('네이버 커머스 API 인증 정보가 설정되지 않았습니다.');
    }

    const response = await this.request<{ contents: unknown[]; totalCount: number }>(
      'POST',
      '/external/v1/pay-order/seller/orders/search',
      {
        orderStatus: params.orderStatus || 'PAYED',
        from: params.fromDate,
        to: params.toDate,
        page: params.page || 1,
        size: params.size || 100,
      }
    );

    return response.data || { contents: [], totalCount: 0 };
  }
}

// 싱글톤 인스턴스
let naverClientInstance: NaverCommerceClient | null = null;

export function getNaverCommerceClient(): NaverCommerceClient {
  if (!naverClientInstance) {
    naverClientInstance = new NaverCommerceClient();
  }
  return naverClientInstance;
}
