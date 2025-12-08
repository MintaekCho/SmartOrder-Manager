# 디자인 시스템

> ClouDoc 스타일 기반 대시보드 디자인 시스템

## 디자인 원칙

1. **명확성**: 데이터를 한눈에 파악할 수 있어야 함
2. **일관성**: 동일한 패턴과 컴포넌트 재사용
3. **효율성**: 최소 클릭으로 원하는 작업 수행
4. **반응성**: 모든 디바이스에서 사용 가능

---

## 컬러 시스템

### Primary Colors
```css
--color-primary-50: #E6F7FB;
--color-primary-100: #B3E8F3;
--color-primary-200: #80D9EB;
--color-primary-300: #4DC9E3;
--color-primary-400: #26BDDC;
--color-primary-500: #4AC1E0;  /* 메인 컬러 */
--color-primary-600: #3A9AB3;
--color-primary-700: #2B7386;
--color-primary-800: #1B4D59;
--color-primary-900: #0C262D;
```

### Semantic Colors
```css
/* 성공 / 긍정 */
--color-success-light: #E8F5E9;
--color-success-main: #4CAF50;
--color-success-dark: #2E7D32;

/* 경고 */
--color-warning-light: #FFF3E0;
--color-warning-main: #F5A623;
--color-warning-dark: #E65100;

/* 위험 / 오류 */
--color-danger-light: #FFEBEE;
--color-danger-main: #E74C3C;
--color-danger-dark: #C62828;

/* 정보 */
--color-info-light: #E3F2FD;
--color-info-main: #2196F3;
--color-info-dark: #1565C0;
```

### Neutral Colors
```css
--color-gray-50: #FAFAFA;
--color-gray-100: #F5F6FA;   /* 배경 */
--color-gray-200: #EEEEEE;
--color-gray-300: #E0E0E0;   /* 보더 */
--color-gray-400: #BDBDBD;
--color-gray-500: #9E9E9E;
--color-gray-600: #757575;
--color-gray-700: #616161;
--color-gray-800: #424242;   /* 본문 텍스트 */
--color-gray-900: #212121;   /* 제목 텍스트 */
```

### Tailwind 설정
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F7FB',
          100: '#B3E8F3',
          200: '#80D9EB',
          300: '#4DC9E3',
          400: '#26BDDC',
          500: '#4AC1E0',
          600: '#3A9AB3',
          700: '#2B7386',
          800: '#1B4D59',
          900: '#0C262D',
        },
        success: '#4CAF50',
        warning: '#F5A623',
        danger: '#E74C3C',
        info: '#2196F3',
      },
    },
  },
};
```

---

## 타이포그래피

### 폰트 패밀리
```css
--font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 폰트 크기
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### 사용 가이드
| 용도 | 크기 | 굵기 |
|-----|-----|-----|
| 페이지 제목 | text-2xl | font-bold (700) |
| 섹션 제목 | text-xl | font-semibold (600) |
| 카드 제목 | text-lg | font-medium (500) |
| 본문 | text-base | font-normal (400) |
| 보조 텍스트 | text-sm | font-normal (400) |
| 캡션/라벨 | text-xs | font-medium (500) |

---

## 스페이싱

### 기본 단위
```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### 레이아웃 스페이싱
```css
--layout-sidebar-width: 240px;
--layout-header-height: 64px;
--layout-content-padding: 24px;
--layout-card-gap: 24px;
```

---

## 그림자 & 테두리

### 그림자
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.16);
```

### 테두리 반경
```css
--radius-sm: 4px;
--radius-md: 8px;      /* 카드, 버튼 */
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px; /* 원형 */
```

---

## 컴포넌트

### 1. 사이드바 (Sidebar)

```
┌────────────────────┐
│  ☁ CoupangAuto    │  <- 로고
├────────────────────┤
│  🔍 검색           │
├────────────────────┤
│                    │
│  📊 대시보드       │  <- 메뉴 그룹
│  📦 상품 관리   >  │
│     └ 상품 분석    │
│     └ 상품 등록    │
│     └ 가격 관리    │
│  🛒 주문 관리   >  │
│  📈 리포트      >  │
│  ⚙️ 설정         │
│                    │
└────────────────────┘

Width: 240px (접힘 시 64px)
Background: #FFFFFF
Border-right: 1px solid #E0E0E0
```

### 2. 헤더 (Header)

```
┌──────────────────────────────────────────────────────────────────┐
│  ☰  홈 > 대시보드                          🔔  👤 홍길동 ▾      │
└──────────────────────────────────────────────────────────────────┘

Height: 64px
Background: #FFFFFF
Border-bottom: 1px solid #E0E0E0
Shadow: shadow-sm
```

### 3. 통계 카드 (Stat Card)

```
┌─────────────────────────────────┐
│  📦 오늘 주문                   │
│                                 │
│     127                         │  <- 큰 숫자
│     전일 대비 +12%  ↑           │  <- 변화율
└─────────────────────────────────┘

Padding: 24px
Background: #FFFFFF
Border-radius: 8px
Shadow: shadow-md
```

### 4. 차트 카드 (Chart Card)

```
┌─────────────────────────────────────────────┐
│  매출 추이                    [일] [주] [월] │
├─────────────────────────────────────────────┤
│                                             │
│     📊 (차트 영역)                          │
│                                             │
│                                             │
└─────────────────────────────────────────────┘

Min-height: 300px
```

### 5. 데이터 테이블 (Data Table)

```
┌───────────────────────────────────────────────────────────────┐
│  최근 주문                              [검색] [필터] [내보내기]│
├───────────────────────────────────────────────────────────────┤
│  주문번호    │ 상품명       │ 수량 │ 금액    │ 상태   │ 처리  │
├───────────────────────────────────────────────────────────────┤
│  #12345     │ 블루투스...  │  1   │ 25,000  │ 🟢대기 │ [발주]│
│  #12344     │ USB 케이블  │  2   │ 12,000  │ 🟡처리 │ [추적]│
│  #12343     │ 마우스패드  │  1   │ 8,500   │ 🔵완료 │ [보기]│
└───────────────────────────────────────────────────────────────┘

Row height: 52px
Header background: #F5F6FA
Hover: #FAFAFA
```

### 6. 상태 배지 (Status Badge)

```css
/* 대기 */
.badge-pending {
  background: #FFF3E0;
  color: #E65100;
}

/* 처리중 */
.badge-processing {
  background: #E3F2FD;
  color: #1565C0;
}

/* 완료 */
.badge-completed {
  background: #E8F5E9;
  color: #2E7D32;
}

/* 오류/취소 */
.badge-error {
  background: #FFEBEE;
  color: #C62828;
}
```

### 7. 버튼 (Button)

```
Primary:   [  등록하기  ]  bg-primary-500, text-white
Secondary: [  취소     ]  bg-gray-100, text-gray-800
Danger:    [  삭제     ]  bg-danger, text-white
Ghost:     [  더보기   ]  bg-transparent, text-primary-500

Size:
- sm: px-3 py-1.5 text-sm
- md: px-4 py-2 text-base
- lg: px-6 py-3 text-lg

Border-radius: 8px
```

### 8. 폼 인풋 (Form Input)

```
Label
┌─────────────────────────────────┐
│  Placeholder...                 │
└─────────────────────────────────┘
Helper text

Height: 44px
Border: 1px solid #E0E0E0
Border-radius: 8px
Focus: border-primary-500, ring-2
```

---

## 반응형 브레이크포인트

```css
/* Tailwind 기본값 사용 */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### 레이아웃 변화
| 화면 | 사이드바 | 레이아웃 |
|-----|---------|---------|
| < 768px | 숨김 (햄버거 메뉴) | 1 column |
| 768px - 1024px | 접힘 (아이콘만) | 2 column |
| > 1024px | 펼침 (전체) | 3-4 column |

---

## 대시보드 레이아웃 예시

```
┌──────────────────────────────────────────────────────────────────────┐
│  CoupangAuto                              🔔  👤 홍길동              │
├────────────┬─────────────────────────────────────────────────────────┤
│            │                                                         │
│  📊 대시보드│  대시보드                                              │
│            │                                                         │
│  📦 상품   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│     분석   │  │오늘주문 │ │미처리   │ │오늘매출 │ │총마진   │          │
│     등록   │  │  127   │ │  17    │ │2.3백만  │ │ 18%    │          │
│     가격   │  └────────┘ └────────┘ └────────┘ └────────┘          │
│            │                                                         │
│  🛒 주문   │  ┌─────────────────────┐ ┌────────────────────┐        │
│     목록   │  │                     │ │                    │        │
│     발주   │  │   매출 차트         │ │   카테고리별 판매   │        │
│            │  │                     │ │                    │        │
│  📈 리포트 │  └─────────────────────┘ └────────────────────┘        │
│            │                                                         │
│  ⚙️ 설정   │  ┌─────────────────────────────────────────────┐        │
│            │  │  최근 주문 목록                              │        │
│            │  │  ─────────────────────────────────────────  │        │
│            │  │  #123  블루투스 이어폰   25,000원   🟢대기   │        │
│            │  │  #122  USB 케이블       12,000원   🔵완료   │        │
│            │  └─────────────────────────────────────────────┘        │
│            │                                                         │
└────────────┴─────────────────────────────────────────────────────────┘
```

---

## 아이콘

### 권장 아이콘 라이브러리
- **Lucide React** (추천): 가볍고 일관된 스타일
- Heroicons: Tailwind 공식

### 주요 아이콘 사용
| 기능 | 아이콘 |
|-----|-------|
| 대시보드 | LayoutDashboard |
| 상품 | Package |
| 주문 | ShoppingCart |
| 분석 | BarChart3 |
| 설정 | Settings |
| 검색 | Search |
| 알림 | Bell |
| 추가 | Plus |
| 수정 | Pencil |
| 삭제 | Trash2 |
| 성공 | CheckCircle |
| 경고 | AlertTriangle |
| 오류 | XCircle |

---

## 애니메이션

### 트랜지션
```css
--transition-fast: 150ms ease;
--transition-normal: 200ms ease;
--transition-slow: 300ms ease;
```

### 사용 예시
```css
/* 호버 효과 */
.card {
  transition: box-shadow var(--transition-normal), transform var(--transition-normal);
}
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* 사이드바 토글 */
.sidebar {
  transition: width var(--transition-slow);
}
```
