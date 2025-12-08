# 시스템 아키텍처 설계

## 전체 아키텍처

```
                                    ┌─────────────────┐
                                    │   사용자 (웹)    │
                                    └────────┬────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           Next.js Application                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  대시보드     │  │  상품관리     │  │  주문관리    │  │   설정     │ │
│  │  Pages      │  │  Pages      │  │  Pages      │  │  Pages    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                        API Routes (tRPC)                        │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
        ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
        │   Core Service    │    │  Crawler Service  │    │  Scheduler        │
        │                   │    │                   │    │  (node-cron)      │
        │ - 상품 분석       │    │ - 도매처 크롤링   │    │                   │
        │ - 마진 계산       │    │ - 쿠팡 데이터     │    │ - 주문 체크       │
        │ - 가격 정책       │    │ - 가격 모니터링   │    │ - 가격 업데이트   │
        └───────────────────┘    └───────────────────┘    │ - 리포트 생성    │
                    │                        │            └───────────────────┘
                    │                        │                        │
                    ▼                        ▼                        ▼
        ┌───────────────────────────────────────────────────────────────────┐
        │                         PostgreSQL Database                       │
        │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
        │  │Products │ │ Orders  │ │Suppliers│ │ Users   │ │Settings │    │
        │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
        └───────────────────────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
        ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐
        │   쿠팡 Wing API   │    │    도매처 API     │    │   Telegram Bot    │
        │                   │    │    (크롤링)       │    │   (알림)          │
        └───────────────────┘    └───────────────────┘    └───────────────────┘
```

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|-----|-----|-----|
| Next.js | 14.x | React 프레임워크 |
| TypeScript | 5.x | 타입 안정성 |
| Tailwind CSS | 3.x | 스타일링 |
| Recharts | 2.x | 차트 시각화 |
| TanStack Query | 5.x | 서버 상태 관리 |
| Zustand | 4.x | 클라이언트 상태 관리 |

### Backend
| 기술 | 버전 | 용도 |
|-----|-----|-----|
| Next.js API Routes | - | API 엔드포인트 |
| tRPC | 10.x | 타입 안전 API |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | 데이터베이스 |
| Playwright | 1.x | 웹 크롤링 |
| node-cron | 3.x | 스케줄링 |

### Infrastructure
| 기술 | 용도 |
|-----|-----|
| Docker | 로컬 개발 환경 |
| Vercel | 배포 (프론트엔드) |
| Railway/Supabase | 데이터베이스 호스팅 |
| GitHub Actions | CI/CD |

---

## 모듈 구조

### packages/core
비즈니스 로직을 담당하는 핵심 모듈

```typescript
packages/core/
├── src/
│   ├── product/
│   │   ├── analyzer.ts      // 상품 분석 로직
│   │   ├── margin.ts        // 마진 계산
│   │   └── pricing.ts       // 가격 정책
│   ├── order/
│   │   ├── processor.ts     // 주문 처리
│   │   ├── fulfillment.ts   // 발주 처리
│   │   └── tracking.ts      // 배송 추적
│   └── report/
│       ├── daily.ts         // 일일 리포트
│       └── analytics.ts     // 분석 리포트
```

### packages/crawler
크롤링 관련 모듈

```typescript
packages/crawler/
├── src/
│   ├── suppliers/
│   │   ├── domeggook.ts     // 도매꾹 크롤러
│   │   ├── domemae.ts       // 도매매 크롤러
│   │   └── ownerclan.ts     // 오너클랜 크롤러
│   ├── coupang/
│   │   ├── product.ts       // 쿠팡 상품 정보
│   │   └── price.ts         // 가격 모니터링
│   └── common/
│       ├── browser.ts       // Playwright 설정
│       └── parser.ts        // HTML 파서
```

### packages/coupang-api
쿠팡 Wing API 클라이언트

```typescript
packages/coupang-api/
├── src/
│   ├── client.ts            // API 클라이언트
│   ├── auth.ts              // 인증 (HMAC)
│   ├── product/
│   │   ├── create.ts        // 상품 등록
│   │   ├── update.ts        // 상품 수정
│   │   └── list.ts          // 상품 조회
│   ├── order/
│   │   ├── list.ts          // 주문 조회
│   │   └── shipping.ts      // 배송 정보 입력
│   └── types/
│       └── index.ts         // API 타입 정의
```

---

## 데이터 흐름

### 상품 등록 플로우
```
1. 도매처 상품 선택
         │
         ▼
2. 상품 정보 크롤링 (이미지, 상세설명, 옵션)
         │
         ▼
3. 쿠팡 형식으로 변환
   - 카테고리 매핑
   - 가격 계산 (마진율 적용)
   - 이미지 리사이징
         │
         ▼
4. 쿠팡 Wing API로 등록
         │
         ▼
5. DB에 상품 매핑 정보 저장
   (도매처 상품 ID ↔ 쿠팡 상품 ID)
```

### 주문 처리 플로우
```
1. 스케줄러: 5분마다 쿠팡 주문 조회
         │
         ▼
2. 신규 주문 감지
         │
         ▼
3. 주문 정보 파싱
   - 상품, 수량, 배송지
         │
         ▼
4. 도매처 매핑 조회
         │
         ▼
5-A. 자동 발주 가능     5-B. 수동 발주 필요
     │                       │
     ▼                       ▼
   도매처 발주 실행      텔레그램 알림 발송
     │                       │
     ▼                       ▼
6. 송장번호 수집        수동으로 발주 후
     │                  송장 입력
     ▼
7. 쿠팡에 송장 등록
     │
     ▼
8. 주문 상태 업데이트 (완료)
```

---

## 보안 고려사항

### API 키 관리
```
- 환경변수로 관리 (.env.local)
- 프로덕션: 암호화된 시크릿 매니저 사용
- 클라이언트에 노출 금지 (서버사이드에서만 사용)
```

### 인증/인가
```
- NextAuth.js 사용
- 세션 기반 인증
- 역할 기반 접근 제어 (추후 다중 사용자 지원 시)
```

### 데이터 보안
```
- HTTPS 필수
- 고객 정보 최소 수집
- 주문 완료 후 배송지 정보 마스킹/삭제
```

---

## 확장성 설계

### 다중 도매처 지원
```typescript
// 도매처 어댑터 패턴
interface SupplierAdapter {
  search(query: string): Promise<Product[]>;
  getProduct(id: string): Promise<ProductDetail>;
  placeOrder?(order: Order): Promise<OrderResult>;
  getTracking?(orderId: string): Promise<TrackingInfo>;
}

// 새 도매처 추가 시 어댑터만 구현
class DomeggookAdapter implements SupplierAdapter { ... }
class DomemaeAdapter implements SupplierAdapter { ... }
```

### 다중 마켓플레이스 지원 (향후)
```typescript
// 마켓플레이스 어댑터 패턴
interface MarketplaceAdapter {
  listProduct(product: Product): Promise<string>;
  getOrders(): Promise<Order[]>;
  updateShipping(orderId: string, tracking: TrackingInfo): Promise<void>;
}

// 쿠팡 외 11번가, 스마트스토어 등 확장 가능
class CoupangAdapter implements MarketplaceAdapter { ... }
class NaverAdapter implements MarketplaceAdapter { ... }
```
