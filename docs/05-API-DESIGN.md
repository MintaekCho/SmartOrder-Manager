# API 설계

## API 아키텍처

tRPC를 사용한 타입 안전 API 설계

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (React)                         │
│                                                             │
│   const { data } = trpc.product.list.useQuery({ ... })     │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    tRPC Router                              │
│                                                             │
│   productRouter, orderRouter, analyticsRouter, ...          │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│                                                             │
│   ProductService, OrderService, CrawlerService, ...         │
│                                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Prisma Client (Database)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## tRPC 라우터 구조

### 메인 라우터
```typescript
// server/trpc/router/index.ts
import { router } from '../trpc';
import { authRouter } from './auth';
import { productRouter } from './product';
import { orderRouter } from './order';
import { supplierRouter } from './supplier';
import { analyticsRouter } from './analytics';
import { settingsRouter } from './settings';

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  order: orderRouter,
  supplier: supplierRouter,
  analytics: analyticsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 상세 API 명세

### 1. 상품 API (productRouter)

#### 상품 목록 조회
```typescript
// product.list
input: {
  page?: number;          // 기본값: 1
  limit?: number;         // 기본값: 20, 최대: 100
  status?: ProductStatus;
  supplierId?: string;
  categoryId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'sellingPrice' | 'margin' | 'sales';
  sortOrder?: 'asc' | 'desc';
}

output: {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### 상품 상세 조회
```typescript
// product.getById
input: { id: string }

output: Product & {
  supplier: Supplier;
  category: Category | null;
  priceHistory: PriceHistory[];
  recentOrders: Order[];
}
```

#### 상품 분석 (도매처 → 쿠팡 비교)
```typescript
// product.analyze
input: {
  supplierCode: string;      // 'DOMEGGOOK'
  supplierProductId: string;
}

output: {
  supplierProduct: {
    id: string;
    name: string;
    price: number;
    images: string[];
    options: ProductOption[];
    shippingFee: number;
  };
  coupangCompetitors: {
    name: string;
    price: number;
    reviewCount: number;
    rating: number;
    url: string;
  }[];
  recommendation: {
    suggestedPrice: number;
    expectedMargin: number;
    competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number;  // 0-100
  };
}
```

#### 상품 등록
```typescript
// product.create
input: {
  supplierId: string;
  supplierProductId: string;
  name: string;
  description?: string;
  categoryId?: string;
  images: string[];
  options: ProductOption[];
  supplierPrice: number;
  sellingPrice: number;
  shippingFee?: number;
}

output: Product
```

#### 쿠팡 등록
```typescript
// product.registerToCoupang
input: { id: string }

output: {
  success: boolean;
  coupangProductId?: string;
  error?: string;
}
```

#### 가격 일괄 업데이트
```typescript
// product.bulkUpdatePrices
input: {
  updates: {
    id: string;
    sellingPrice: number;
  }[];
}

output: {
  updated: number;
  failed: { id: string; error: string }[];
}
```

---

### 2. 주문 API (orderRouter)

#### 주문 목록 조회
```typescript
// order.list
input: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;  // 주문번호, 상품명, 구매자명
}

output: {
  items: (Order & { product: Product })[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### 주문 상세 조회
```typescript
// order.getById
input: { id: string }

output: Order & {
  product: Product & { supplier: Supplier };
  history: OrderHistory[];
}
```

#### 주문 동기화 (쿠팡에서 가져오기)
```typescript
// order.sync
input: {
  startDate?: Date;  // 기본: 오늘
  endDate?: Date;
}

output: {
  newOrders: number;
  updatedOrders: number;
  errors: string[];
}
```

#### 발주 처리
```typescript
// order.placeSupplierOrder
input: { orderId: string }

output: {
  success: boolean;
  supplierOrderId?: string;
  error?: string;
}
```

#### 송장 등록
```typescript
// order.updateTracking
input: {
  orderId: string;
  trackingCompany: string;
  trackingNumber: string;
}

output: {
  success: boolean;
  error?: string;
}
```

#### 주문 상태 업데이트
```typescript
// order.updateStatus
input: {
  orderId: string;
  status: OrderStatus;
  note?: string;
}

output: Order
```

---

### 3. 도매처 API (supplierRouter)

#### 도매처 목록
```typescript
// supplier.list
output: Supplier[]
```

#### 도매처 상품 검색
```typescript
// supplier.searchProducts
input: {
  supplierCode: string;
  query: string;
  category?: string;
  page?: number;
  limit?: number;
}

output: {
  items: SupplierProduct[];
  total: number;
  hasMore: boolean;
}
```

#### 도매처 상품 상세
```typescript
// supplier.getProduct
input: {
  supplierCode: string;
  productId: string;
}

output: SupplierProductDetail
```

#### 도매처 인증 설정
```typescript
// supplier.setCredentials
input: {
  supplierId: string;
  credentials: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
}

output: { success: boolean }
```

---

### 4. 분석 API (analyticsRouter)

#### 대시보드 통계
```typescript
// analytics.dashboard
input: {
  period: 'today' | 'week' | 'month';
}

output: {
  summary: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProfit: number;
    averageMargin: number;
  };
  comparison: {
    ordersChange: number;      // 전기 대비 %
    revenueChange: number;
    profitChange: number;
  };
}
```

#### 매출 차트 데이터
```typescript
// analytics.revenueChart
input: {
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
}

output: {
  labels: string[];
  datasets: {
    revenue: number[];
    profit: number[];
    orders: number[];
  };
}
```

#### 상품별 성과
```typescript
// analytics.productPerformance
input: {
  startDate: Date;
  endDate: Date;
  limit?: number;
  sortBy?: 'revenue' | 'profit' | 'sales';
}

output: {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  profit: number;
  margin: number;
}[]
```

#### 카테고리별 통계
```typescript
// analytics.categoryStats
input: {
  startDate: Date;
  endDate: Date;
}

output: {
  categoryId: string;
  categoryName: string;
  productCount: number;
  sales: number;
  revenue: number;
}[]
```

---

### 5. 설정 API (settingsRouter)

#### 사용자 설정 조회
```typescript
// settings.get
output: UserSettings
```

#### 사용자 설정 업데이트
```typescript
// settings.update
input: Partial<UserSettings>

output: UserSettings
```

#### 쿠팡 API 설정
```typescript
// settings.setCoupangCredentials
input: {
  accessKey: string;
  secretKey: string;
  vendorId: string;
}

output: {
  success: boolean;
  verified: boolean;  // API 연결 테스트 결과
}
```

#### 텔레그램 알림 설정
```typescript
// settings.setTelegramBot
input: {
  botToken: string;
  chatId: string;
}

output: {
  success: boolean;
  verified: boolean;
}
```

#### 가격 정책 설정
```typescript
// settings.setPricingPolicy
input: {
  defaultMarginRate: number;     // 기본 마진율 (%)
  minMarginRate: number;         // 최소 마진율
  roundingUnit: number;          // 가격 반올림 단위 (ex: 100)
  includeShipping: boolean;      // 배송비 포함 여부
}

output: PricingPolicy
```

---

## 타입 정의

```typescript
// types/index.ts

interface ProductOption {
  name: string;        // "색상", "사이즈"
  values: {
    name: string;      // "블랙", "M"
    priceAdjust: number;  // 추가금
    stock?: number;
  }[];
}

interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  thumbnailUrl: string;
  category?: string;
  salesCount?: number;
}

interface SupplierProductDetail extends SupplierProduct {
  description: string;
  images: string[];
  options: ProductOption[];
  shippingFee: number;
  minOrderQuantity: number;
}

interface UserSettings {
  notifications: {
    newOrder: boolean;
    priceChange: boolean;
    outOfStock: boolean;
    dailyReport: boolean;
  };
  pricing: PricingPolicy;
  coupang: {
    isConnected: boolean;
    vendorId?: string;
  };
  telegram: {
    isConnected: boolean;
    chatId?: string;
  };
}

interface PricingPolicy {
  defaultMarginRate: number;
  minMarginRate: number;
  roundingUnit: number;
  includeShipping: boolean;
}
```

---

## 에러 처리

### 에러 코드
```typescript
enum ErrorCode {
  // 인증
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // 입력 검증
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // 리소스
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // 외부 서비스
  COUPANG_API_ERROR = 'COUPANG_API_ERROR',
  SUPPLIER_ERROR = 'SUPPLIER_ERROR',
  CRAWLING_ERROR = 'CRAWLING_ERROR',

  // 서버
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
}
```

### 에러 응답 형식
```typescript
interface ApiError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
}
```

---

## Rate Limiting

| API 그룹 | 제한 |
|---------|-----|
| 일반 조회 | 100 req/min |
| 크롤링 | 10 req/min |
| 쿠팡 API | 쿠팡 정책 준수 |
| 대량 작업 | 5 req/min |
