# 데이터베이스 스키마 설계

## ERD (Entity Relationship Diagram)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     User        │       │    Supplier     │       │    Category     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │       │ id              │
│ email           │       │ name            │       │ name            │
│ name            │       │ code            │       │ coupangId       │
│ passwordHash    │       │ apiKey?         │       │ parentId?       │
│ telegramChatId? │       │ credentials?    │       └────────┬────────┘
│ settings        │       │ isActive        │                │
└────────┬────────┘       └────────┬────────┘                │
         │                         │                          │
         │                         │                          │
         ▼                         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              Product                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id, userId, supplierId, categoryId                                  │
│ supplierProductId, coupangProductId?, coupangVendorItemId?          │
│ name, description, supplierPrice, sellingPrice, margin              │
│ images[], options[], status, lastSyncedAt                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  PriceHistory   │   │     Order       │   │  ProductStats   │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤
│ id              │   │ id              │   │ id              │
│ productId       │   │ productId       │   │ productId       │
│ supplierPrice   │   │ userId          │   │ date            │
│ sellingPrice    │   │ coupangOrderId  │   │ views           │
│ competitorPrice │   │ quantity        │   │ sales           │
│ recordedAt      │   │ totalAmount     │   │ revenue         │
└─────────────────┘   │ buyerName       │   │ margin          │
                      │ buyerPhone      │   └─────────────────┘
                      │ shippingAddress │
                      │ status          │
                      │ supplierOrderId?│
                      │ trackingNumber? │
                      │ orderedAt       │
                      │ shippedAt?      │
                      │ deliveredAt?    │
                      └────────┬────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │  OrderHistory   │
                      ├─────────────────┤
                      │ id              │
                      │ orderId         │
                      │ status          │
                      │ note            │
                      │ createdAt       │
                      └─────────────────┘
```

---

## Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// 사용자 관련
// ============================================

model User {
  id             String    @id @default(cuid())
  email          String    @unique
  name           String
  passwordHash   String
  telegramChatId String?

  // 설정
  settings       Json      @default("{}")

  // 관계
  products       Product[]
  orders         Order[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@map("users")
}

// ============================================
// 도매처 관련
// ============================================

model Supplier {
  id          String    @id @default(cuid())
  name        String    // 도매꾹, 도매매 등
  code        String    @unique // DOMEGGOOK, DOMEMAE
  baseUrl     String

  // 인증 정보 (암호화 저장)
  credentials Json?

  isActive    Boolean   @default(true)

  // 관계
  products    Product[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@map("suppliers")
}

// ============================================
// 카테고리
// ============================================

model Category {
  id           String     @id @default(cuid())
  name         String
  coupangId    String?    // 쿠팡 카테고리 ID

  // 계층 구조
  parentId     String?
  parent       Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children     Category[] @relation("CategoryHierarchy")

  // 관계
  products     Product[]

  @@map("categories")
}

// ============================================
// 상품
// ============================================

model Product {
  id                   String    @id @default(cuid())

  // 관계 ID
  userId               String
  user                 User      @relation(fields: [userId], references: [id])

  supplierId           String
  supplier             Supplier  @relation(fields: [supplierId], references: [id])

  categoryId           String?
  category             Category? @relation(fields: [categoryId], references: [id])

  // 도매처 정보
  supplierProductId    String    // 도매처 상품 ID
  supplierProductUrl   String?

  // 쿠팡 정보
  coupangProductId     String?   // 쿠팡 상품 ID (등록 후)
  coupangVendorItemId  String?   // 쿠팡 옵션 ID
  coupangProductUrl    String?

  // 상품 정보
  name                 String
  description          String?   @db.Text

  // 이미지 (URL 배열)
  images               Json      @default("[]")

  // 옵션 (색상, 사이즈 등)
  options              Json      @default("[]")

  // 가격
  supplierPrice        Int       // 도매가
  sellingPrice         Int       // 판매가
  shippingFee          Int       @default(0)

  // 계산된 값
  margin               Float     // 마진율 (%)
  estimatedProfit      Int       // 예상 순이익

  // 상태
  status               ProductStatus @default(DRAFT)

  // 메타데이터
  lastSyncedAt         DateTime?

  // 관계
  priceHistory         PriceHistory[]
  orders               Order[]
  stats                ProductStats[]

  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@unique([supplierId, supplierProductId])
  @@index([userId])
  @@index([status])
  @@map("products")
}

enum ProductStatus {
  DRAFT           // 임시저장
  PENDING         // 등록 대기
  REGISTERED      // 쿠팡 등록 완료
  ACTIVE          // 판매중
  PAUSED          // 판매 일시중지
  OUT_OF_STOCK    // 품절
  DISCONTINUED    // 판매종료
}

// ============================================
// 가격 히스토리
// ============================================

model PriceHistory {
  id              String   @id @default(cuid())

  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  supplierPrice   Int      // 도매가
  sellingPrice    Int      // 판매가
  competitorPrice Int?     // 경쟁사 최저가

  recordedAt      DateTime @default(now())

  @@index([productId, recordedAt])
  @@map("price_history")
}

// ============================================
// 주문
// ============================================

model Order {
  id               String      @id @default(cuid())

  // 관계
  productId        String
  product          Product     @relation(fields: [productId], references: [id])

  userId           String
  user             User        @relation(fields: [userId], references: [id])

  // 쿠팡 주문 정보
  coupangOrderId   String      @unique
  coupangOrderItemId String?

  // 주문 내용
  quantity         Int
  unitPrice        Int
  totalAmount      Int

  // 구매자 정보 (배송 완료 후 삭제 고려)
  buyerName        String
  buyerPhone       String
  shippingAddress  String
  shippingMemo     String?

  // 상태
  status           OrderStatus @default(NEW)

  // 도매처 발주 정보
  supplierOrderId  String?
  supplierOrderedAt DateTime?

  // 배송 정보
  trackingCompany  String?
  trackingNumber   String?

  // 타임스탬프
  orderedAt        DateTime    // 쿠팡 주문 시간
  shippedAt        DateTime?
  deliveredAt      DateTime?

  // 관계
  history          OrderHistory[]

  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([userId, orderedAt])
  @@index([status])
  @@map("orders")
}

enum OrderStatus {
  NEW              // 신규 주문
  PENDING_ORDER    // 발주 대기
  ORDERED          // 발주 완료
  SHIPPED          // 배송중
  DELIVERED        // 배송 완료
  CANCELLED        // 취소
  RETURNED         // 반품
}

// ============================================
// 주문 히스토리
// ============================================

model OrderHistory {
  id        String      @id @default(cuid())

  orderId   String
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)

  status    OrderStatus
  note      String?

  createdAt DateTime    @default(now())

  @@index([orderId])
  @@map("order_history")
}

// ============================================
// 상품 통계
// ============================================

model ProductStats {
  id        String   @id @default(cuid())

  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)

  date      DateTime @db.Date

  views     Int      @default(0)
  clicks    Int      @default(0)
  sales     Int      @default(0)
  revenue   Int      @default(0)
  profit    Int      @default(0)

  @@unique([productId, date])
  @@index([date])
  @@map("product_stats")
}

// ============================================
// 시스템 설정
// ============================================

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json

  updatedAt DateTime @updatedAt

  @@map("system_settings")
}

// ============================================
// 작업 로그
// ============================================

model JobLog {
  id        String   @id @default(cuid())

  jobType   String   // SYNC_ORDERS, SYNC_PRICES, etc.
  status    JobStatus

  startedAt DateTime
  endedAt   DateTime?

  result    Json?    // 성공/실패 상세
  error     String?

  @@index([jobType, startedAt])
  @@map("job_logs")
}

enum JobStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

---

## 인덱스 전략

### 자주 사용되는 쿼리별 인덱스

| 쿼리 | 인덱스 |
|-----|-------|
| 사용자별 상품 목록 | `products(userId)` |
| 상태별 상품 필터 | `products(status)` |
| 날짜별 주문 조회 | `orders(userId, orderedAt)` |
| 상태별 주문 필터 | `orders(status)` |
| 상품별 가격 추이 | `price_history(productId, recordedAt)` |
| 일별 통계 조회 | `product_stats(date)` |

---

## 마이그레이션 전략

### 초기 설정
```bash
# 스키마 생성 및 마이그레이션
npx prisma migrate dev --name init

# 시드 데이터
npx prisma db seed
```

### 시드 데이터 예시
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 도매처 기본 데이터
  await prisma.supplier.createMany({
    data: [
      {
        name: '도매꾹',
        code: 'DOMEGGOOK',
        baseUrl: 'https://domeggook.com',
      },
      {
        name: '도매매',
        code: 'DOMEMAE',
        baseUrl: 'https://domemae.com',
      },
      {
        name: '오너클랜',
        code: 'OWNERCLAN',
        baseUrl: 'https://ownerclan.com',
      },
    ],
  });

  console.log('Seed completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 데이터 보존 정책

| 데이터 | 보존 기간 | 비고 |
|-------|----------|-----|
| 주문 정보 | 5년 | 세금 관련 |
| 구매자 개인정보 | 배송 완료 후 3개월 | 마스킹 처리 |
| 가격 히스토리 | 1년 | 이후 집계 데이터만 보존 |
| 작업 로그 | 3개월 | 디버깅용 |
| 상품 통계 | 무기한 | 분석용 |
