# CLAUDE.md

이 파일은 Claude Code가 이 프로젝트를 이해하는 데 필요한 컨텍스트를 제공합니다.

## 프로젝트 개요

쿠팡 셀러를 위한 자동화 플랫폼입니다. 상품 등록, 주문 관리, 재고 관리, 마진 분석, AI 썸네일 생성 등의 기능을 제공합니다.

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma 7 (PostgreSQL)
- **인증**: NextAuth.js (Google, Naver, Kakao OAuth)
- **결제**: 토스페이먼츠 (정기결제)
- **AI**: Google Gemini API
- **크롤링**: Playwright, Puppeteer
- **인프라**: Vercel, Docker, Supabase

## 프로젝트 구조

```
/
├── docs/                    # 설계 문서
└── web/                     # Next.js 웹 애플리케이션
    ├── src/
    │   ├── app/             # Next.js App Router
    │   │   ├── api/         # API 라우트
    │   │   ├── accounting/  # 회계
    │   │   ├── auth/        # 인증
    │   │   ├── products/    # 상품 관리
    │   │   ├── inventory/   # 재고 관리
    │   │   ├── shop/        # 자사몰
    │   │   └── ...
    │   ├── components/      # React 컴포넌트
    │   ├── lib/             # 유틸리티
    │   │   ├── coupang-api/ # 쿠팡 API 클라이언트
    │   │   ├── crawler/     # 웹 크롤러
    │   │   └── ...
    │   └── types/           # TypeScript 타입
    ├── prisma/
    │   └── schema.prisma    # DB 스키마
    └── scripts/             # 유틸리티 스크립트
```

## 자주 사용하는 명령어

```bash
cd web

# 개발 서버 실행 (포트 3002)
pnpm dev

# 프로덕션 빌드
pnpm build

# 린트 검사
pnpm lint

# Prisma 마이그레이션
npx prisma migrate dev

# Prisma 클라이언트 생성
npx prisma generate

# Prisma Studio (DB GUI)
npx prisma studio
```

## 환경 변수

필수 환경 변수 (`.env` 파일에 설정):

```
DATABASE_URL=           # PostgreSQL 연결 문자열
NEXTAUTH_SECRET=        # NextAuth JWT 시크릿
NEXTAUTH_URL=           # 애플리케이션 URL

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=

# 외부 API
GEMINI_API_KEY=         # Google Gemini AI
COUPANG_VENDOR_ID=      # 쿠팡 Wing API
COUPANG_ACCESS_KEY=
COUPANG_SECRET_KEY=

# 결제
TOSS_CLIENT_KEY=        # 토스페이먼츠
TOSS_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 주요 기능

1. **쿠팡 Wing API 연동**: 상품 등록, 주문 조회, 송장 입력, 정산 조회
2. **상품 관리**: 도매처 → 쿠팡 상품 등록, 상세페이지 에디터
3. **재고 관리**: 창고, 로케이션, 입출고, 재고 실사
4. **발주 관리**: 발주서 작성, 부분 입고
5. **자사몰**: 상품 카탈로그, 주문, 리뷰
6. **AI 기능**: 썸네일 자동 생성

## 시스템 모드

사용자별로 운영 모드 선택 가능:
- **DROPSHIPPING**: 위탁판매 (재고 없이 운영)
- **INVENTORY**: 재고 기반 운영
- **HYBRID**: 통합 운영

## 데이터베이스

PostgreSQL + Prisma ORM 사용. 주요 모델:

- **User, Account, Session**: 인증
- **Product, Category, PriceHistory**: 상품
- **Order, OrderHistory**: 주문
- **Warehouse, InventoryItem, StockMovement**: 재고
- **PurchaseOrder, PurchaseOrderItem**: 발주
- **Subscription, Payment**: 구독/결제

## API 라우트 패턴

- `/api/coupang/*`: 쿠팡 Wing API 연동
- `/api/crawl/*`: 웹 크롤링
- `/api/research/*`: 마진 분석, 트렌드 분석
- `/api/shop/*`: 자사몰 API
- `/api/dashboard/*`: 대시보드 데이터
- `/api/payment/*`: 결제 처리
- `/api/cron/*`: 정기 작업 (주문 동기화, 정기결제)

## 코드 컨벤션

- TypeScript strict mode 사용
- 경로 별칭: `@/*` → `./src/*`
- ESLint + Next.js 권장 규칙
- 커밋 메시지: Conventional Commits

## 개발 규칙 (IMPORTANT)

### 절대 금지 사항
1. **목데이터 사용 금지**: 기능 구현 시 목업/하드코딩 데이터 대신 반드시 실제 API 연동
2. **setTimeout으로 API 시뮬레이션 금지**: `await new Promise(resolve => setTimeout(...))` 패턴 사용 금지
3. **Math.random()으로 성공/실패 결정 금지**: 실제 API 응답 사용

### API 구현 패턴
```typescript
// ❌ 잘못된 예시
const handleSave = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const success = Math.random() > 0.3;
  if (success) alert('저장 완료');
};

// ✅ 올바른 예시
const handleSave = async () => {
  const response = await fetch('/api/...', { method: 'POST', body: JSON.stringify(data) });
  const result = await response.json();
  if (result.success) alert('저장 완료');
};
```

### Next.js API Route 패턴
```typescript
// GET: 목록 조회
export async function GET(request: NextRequest) {
  const userId = await getOrCreateDefaultUserId();
  const data = await prisma.model.findMany({ where: { userId } });
  return NextResponse.json({ success: true, data });
}

// POST: 생성
export async function POST(request: NextRequest) {
  const userId = await getOrCreateDefaultUserId();
  const body = await request.json();
  const data = await prisma.model.create({ data: { ...body, userId } });
  return NextResponse.json({ success: true, data });
}

// PUT: 수정 (동적 라우트 [id])
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ...
}
```

### 프론트엔드 데이터 로딩 패턴
```typescript
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/...');
      const result = await response.json();
      if (result.success) setData(result.data);
    } catch (error) {
      console.error('로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [dependencies]);
```

### 에러 처리 패턴
```typescript
try {
  // API 호출
} catch (error) {
  console.error('작업 오류:', error);
  return NextResponse.json(
    { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' },
    { status: 500 }
  );
}
```

## 참고 문서

- `docs/01-PROJECT-OVERVIEW.md`: 프로젝트 개요
- `docs/02-SYSTEM-ARCHITECTURE.md`: 시스템 아키텍처
- `docs/04-DATABASE-SCHEMA.md`: DB 스키마
- `docs/05-API-DESIGN.md`: API 설계
