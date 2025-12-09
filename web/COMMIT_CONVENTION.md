# Commit Convention

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Type

| Type | Description |
|------|-------------|
| `feat` | 새로운 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음) |
| `refactor` | 코드 리팩토링 |
| `perf` | 성능 개선 |
| `test` | 테스트 코드 추가/수정 |
| `chore` | 빌드 설정, 패키지 매니저 설정 등 |
| `ci` | CI/CD 관련 변경 |
| `revert` | 이전 커밋 되돌리기 |

## Scope (선택사항)

변경된 범위를 나타냅니다.

| Scope | Description |
|-------|-------------|
| `api` | API 관련 변경 |
| `ui` | UI 컴포넌트 변경 |
| `coupang` | 쿠팡 API 연동 관련 |
| `order` | 주문 관련 기능 |
| `product` | 상품 관련 기능 |
| `sourcing` | 소싱 관련 기능 |
| `auth` | 인증 관련 |
| `db` | 데이터베이스 관련 |
| `config` | 설정 관련 |

## Subject

- 50자 이내로 작성
- 마침표 사용하지 않음
- 명령형 현재 시제 사용 (한글: "추가", "수정", "삭제" / 영어: "add", "fix", "remove")

## Body (선택사항)

- 무엇을, 왜 변경했는지 설명
- 72자마다 줄바꿈
- 본문과 제목 사이 빈 줄 추가

## Footer (선택사항)

- Breaking Changes 명시
- Issue 참조 (예: `Closes #123`, `Fixes #456`)

## Examples

### 기능 추가
```
feat(coupang): 쿠팡 Wing API HMAC 인증 구현

- HMAC-SHA256 서명 생성 로직 추가
- datetime 형식을 yymmddTHHMMSSZ로 수정
- X-Requested-By 헤더 추가
```

### 버그 수정
```
fix(api): 상품 상세 조회 API 경로 수정

seller-products API의 sellerProductId 파라미터 사용하도록 변경
기존 경로가 404 에러 발생하던 문제 해결
```

### 리팩토링
```
refactor(ui): 사이드바 메뉴 구조 개선

- 상품 소싱, 상품 제작 메뉴 분리
- 공급처 관리 메뉴 추가
- 도구 메뉴 추가
```

### 문서
```
docs: 커밋 컨벤션 문서 추가
```

### 설정 변경
```
chore(deps): recharts 패키지 추가
```

## Git Workflow

1. 기능 개발 시 feature 브랜치 생성 권장
2. 의미 있는 단위로 커밋
3. PR 시 squash merge 권장
