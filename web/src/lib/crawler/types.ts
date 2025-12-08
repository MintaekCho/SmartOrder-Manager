// 도매처 크롤러 공통 타입 정의

export interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  category?: string;
  salesCount?: number;
  url: string;
}

export interface SupplierProductDetail extends SupplierProduct {
  description: string;
  images: string[];
  options: ProductOption[];
  shippingFee: number;
  minOrderQuantity: number;
  specifications?: Record<string, string>;
}

export interface ProductOption {
  name: string; // "색상", "사이즈"
  values: OptionValue[];
}

export interface OptionValue {
  name: string; // "블랙", "M"
  priceAdjust: number; // 추가금
  stock?: number;
}

export interface SearchParams {
  query: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'popular' | 'newest' | 'price_low' | 'price_high';
}

export interface SearchResult {
  items: SupplierProduct[];
  total: number;
  page: number;
  hasMore: boolean;
}

export interface CrawlerConfig {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
}

// 도매처 어댑터 인터페이스
export interface SupplierAdapter {
  readonly name: string;
  readonly code: string;
  readonly baseUrl: string;

  // 상품 검색
  search(params: SearchParams): Promise<SearchResult>;

  // 상품 상세 정보
  getProduct(productId: string): Promise<SupplierProductDetail>;

  // 로그인 (필요한 경우)
  login?(credentials: { username: string; password: string }): Promise<boolean>;

  // 발주 (자동화 가능한 경우)
  placeOrder?(order: PlaceOrderParams): Promise<PlaceOrderResult>;
}

export interface PlaceOrderParams {
  productId: string;
  optionId?: string;
  quantity: number;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    zipCode: string;
    memo?: string;
  };
}

export interface PlaceOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}
