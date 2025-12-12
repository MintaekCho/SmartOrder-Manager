# 싱이음 OAuth 설정 가이드

소셜 로그인(카카오, 네이버, 구글) 설정을 위한 단계별 가이드입니다.

---

## 목차
1. [카카오 로그인 설정](#1-카카오-로그인-설정)
2. [네이버 로그인 설정](#2-네이버-로그인-설정)
3. [구글 로그인 설정](#3-구글-로그인-설정)
4. [환경변수 설정](#4-환경변수-설정)

---

## 1. 카카오 로그인 설정

### 1.1 카카오 개발자 사이트 접속
- URL: https://developers.kakao.com
- 카카오 계정으로 로그인

### 1.2 애플리케이션 생성

#### [관리자 시스템용]
1. **내 애플리케이션** → **애플리케이션 추가하기** 클릭
2. 앱 정보 입력:
   - **앱 이름**: `싱이음 관리자`
   - **사업자명**: (사업자명 또는 개인 이름)
3. **저장** 클릭

#### [자사몰용]
1. 같은 방법으로 새 애플리케이션 추가
2. 앱 정보 입력:
   - **앱 이름**: `싱이음`
   - **사업자명**: (동일)

### 1.3 앱 키 확인
1. 생성된 앱 클릭 → **앱 키** 메뉴
2. 다음 키들을 복사해서 저장:
   ```
   REST API 키: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  ← 이게 CLIENT_ID
   ```

### 1.4 카카오 로그인 활성화
1. 좌측 메뉴 → **제품 설정** → **카카오 로그인**
2. **활성화 설정**: ON으로 변경

### 1.5 Redirect URI 설정
1. **카카오 로그인** → **Redirect URI** 메뉴
2. URI 등록:

#### 관리자 시스템:
```
http://localhost:3002/api/auth/callback/kakao
https://admin.singeum.com/api/auth/callback/kakao
```

#### 자사몰:
```
http://localhost:3005/api/auth/callback/kakao
https://www.singeum.com/api/auth/callback/kakao
```

### 1.6 동의항목 설정
1. **카카오 로그인** → **동의항목** 메뉴
2. 다음 항목들 설정:

| 항목 | 설정 | 필수/선택 |
|------|------|----------|
| 닉네임 | 필수 동의 | 필수 |
| 프로필 사진 | 선택 동의 | 선택 |
| 카카오계정(이메일) | 선택 동의 | **필수로 변경 권장** |

> ⚠️ **이메일 필수 동의 설정하기**
> - 이메일을 필수로 받으려면 **비즈 앱 전환**이 필요합니다
> - **앱 설정** → **비즈니스** → **비즈 앱 전환** 클릭
> - 사업자등록증 없이도 개인 개발자로 전환 가능

### 1.7 Client Secret 생성 (보안 강화용, 선택)
1. **제품 설정** → **카카오 로그인** → **보안** 메뉴
2. **Client Secret** → **코드 생성** 클릭
3. 생성된 코드 복사 (이게 `KAKAO_CLIENT_SECRET`)

### 1.8 최종 필요 값
```env
# 관리자 시스템
KAKAO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        # REST API 키
KAKAO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # Client Secret (선택)

# 자사몰 (별도 앱이면 다른 값)
KAKAO_CLIENT_ID=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
KAKAO_CLIENT_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## 2. 네이버 로그인 설정

### 2.1 네이버 개발자 센터 접속
- URL: https://developers.naver.com
- 네이버 계정으로 로그인

### 2.2 애플리케이션 등록

1. **Application** → **애플리케이션 등록** 클릭

#### [관리자 시스템용]
2. 애플리케이션 정보 입력:
   - **애플리케이션 이름**: `싱이음 관리자`
   - **사용 API**: `네이버 로그인` 선택

3. **제공 정보 선택** (필수로 체크):
   - ✅ 회원이름
   - ✅ 이메일 주소
   - ✅ 프로필 사진 (선택)
   - ✅ 별명 (선택)

4. **로그인 오픈 API 서비스 환경**:
   - 환경 추가: `PC 웹` 선택
   - **서비스 URL**:
     ```
     http://localhost:3002
     ```
   - **Callback URL**:
     ```
     http://localhost:3002/api/auth/callback/naver
     ```

5. 프로덕션 환경 추가 (나중에):
   - 환경 추가: `PC 웹` 선택
   - **서비스 URL**: `https://admin.singeum.com`
   - **Callback URL**: `https://admin.singeum.com/api/auth/callback/naver`

#### [자사몰용]
- 같은 방법으로 새 애플리케이션 등록
- **애플리케이션 이름**: `싱이음`
- **서비스 URL**: `http://localhost:3005` / `https://www.singeum.com`
- **Callback URL**: 해당 URL + `/api/auth/callback/naver`

### 2.3 Client ID / Secret 확인
1. 애플리케이션 등록 완료 후 **애플리케이션 정보** 확인
2. 다음 값들 복사:
   ```
   Client ID: xxxxxxxxxxxxxx
   Client Secret: xxxxxxxxxx
   ```

### 2.4 검수 요청 (프로덕션 필요 시)
> ⚠️ 개발 중에는 검수 없이 본인 계정으로 테스트 가능
> 프로덕션 배포 시 **검수 요청** 필요

1. **API 설정** → **검수 요청** 메뉴
2. 필요 서류:
   - 서비스 소개서
   - 개인정보처리방침 URL
   - 이용약관 URL

### 2.5 최종 필요 값
```env
# 관리자 시스템
NAVER_CLIENT_ID=xxxxxxxxxxxx
NAVER_CLIENT_SECRET=xxxxxxxxxx

# 자사몰 (별도 앱이면 다른 값)
NAVER_CLIENT_ID=yyyyyyyyyyyy
NAVER_CLIENT_SECRET=yyyyyyyyyy
```

---

## 3. 구글 로그인 설정

### 3.1 Google Cloud Console 접속
- URL: https://console.cloud.google.com
- Google 계정으로 로그인

### 3.2 프로젝트 생성

#### [관리자 시스템용]
1. 상단 프로젝트 선택 → **새 프로젝트**
2. 프로젝트 정보:
   - **프로젝트 이름**: `singeum-admin`
   - **위치**: (기본값)
3. **만들기** 클릭

#### [자사몰용]
- 같은 방법으로 `singeum-shop` 프로젝트 생성

### 3.3 OAuth 동의 화면 설정
1. 좌측 메뉴 → **API 및 서비스** → **OAuth 동의 화면**
2. User Type 선택:
   - **외부** 선택 (일반 사용자용)
   - **만들기** 클릭

3. 앱 정보 입력:
   - **앱 이름**: `싱이음 관리자` 또는 `싱이음`
   - **사용자 지원 이메일**: (본인 이메일)
   - **앱 로고**: (선택사항)
   - **앱 도메인**:
     - 애플리케이션 홈페이지: `https://admin.singeum.com` 또는 `https://www.singeum.com`
   - **승인된 도메인**: `singeum.com`
   - **개발자 연락처 정보**: (본인 이메일)

4. **저장 후 계속**

### 3.4 범위(Scopes) 설정
1. **범위 추가 또는 삭제** 클릭
2. 다음 범위 선택:
   - `email` - 이메일 주소 확인
   - `profile` - 기본 프로필 정보
   - `openid` - OpenID Connect

3. **업데이트** → **저장 후 계속**

### 3.5 테스트 사용자 추가 (개발 중)
1. **테스트 사용자** 단계에서
2. **+ ADD USERS** 클릭
3. 테스트할 구글 계정 이메일 추가
4. **저장 후 계속**

> ⚠️ 앱이 "테스트" 상태일 때는 등록된 테스트 사용자만 로그인 가능
> 프로덕션 배포 시 **앱 게시** 필요

### 3.6 OAuth 클라이언트 ID 생성
1. 좌측 메뉴 → **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `싱이음 관리자 웹 클라이언트`

5. **승인된 JavaScript 원본**:
   ```
   http://localhost:3002
   https://admin.singeum.com
   ```

6. **승인된 리디렉션 URI**:
   ```
   http://localhost:3002/api/auth/callback/google
   https://admin.singeum.com/api/auth/callback/google
   ```

7. **만들기** 클릭

### 3.7 Client ID / Secret 확인
- 생성 완료 시 팝업에서 확인 가능
- 또는 **사용자 인증 정보** 목록에서 클릭하여 확인

```
클라이언트 ID: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
클라이언트 보안 비밀번호: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.8 최종 필요 값
```env
# 관리자 시스템
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 자사몰 (별도 프로젝트면 다른 값)
GOOGLE_CLIENT_ID=yyyyyyyyyyyy-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-yyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## 4. 환경변수 설정

### 4.1 관리자 시스템 (.env)
파일 위치: `/coupang-automation/web/.env`

```env
# NextAuth 설정
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-random-secret-key-here-minimum-32-characters

# 카카오 로그인
KAKAO_CLIENT_ID=your_kakao_rest_api_key
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# 네이버 로그인
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 구글 로그인
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4.2 자사몰 (.env)
파일 위치: `/my-shop/.env`

```env
# NextAuth 설정
NEXTAUTH_URL=http://localhost:3005
NEXTAUTH_SECRET=another-random-secret-key-minimum-32-characters

# 카카오 로그인 (자사몰용 별도 앱)
KAKAO_CLIENT_ID=your_kakao_rest_api_key_for_shop
KAKAO_CLIENT_SECRET=your_kakao_client_secret_for_shop

# 네이버 로그인 (자사몰용 별도 앱)
NAVER_CLIENT_ID=your_naver_client_id_for_shop
NAVER_CLIENT_SECRET=your_naver_client_secret_for_shop

# 구글 로그인 (자사몰용 별도 프로젝트)
GOOGLE_CLIENT_ID=your_google_client_id_for_shop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_for_shop

# 관리자 시스템 DB 연결 (동일 DB 사용)
DATABASE_URL=postgresql://...
```

### 4.3 NEXTAUTH_SECRET 생성 방법
터미널에서 실행:
```bash
# 방법 1: openssl
openssl rand -base64 32

# 방법 2: node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 5. 체크리스트

### 카카오
- [ ] 개발자 사이트 가입
- [ ] 관리자용 애플리케이션 생성
- [ ] 자사몰용 애플리케이션 생성
- [ ] 카카오 로그인 활성화 (양쪽 모두)
- [ ] Redirect URI 등록 (localhost + 프로덕션)
- [ ] 동의항목 설정 (이메일 필수)
- [ ] REST API 키 복사
- [ ] Client Secret 생성 (선택)

### 네이버
- [ ] 개발자 센터 가입
- [ ] 관리자용 애플리케이션 등록
- [ ] 자사몰용 애플리케이션 등록
- [ ] 제공 정보 선택 (이름, 이메일)
- [ ] 서비스 URL 등록
- [ ] Callback URL 등록
- [ ] Client ID / Secret 복사

### 구글
- [ ] Cloud Console 프로젝트 생성 (관리자용)
- [ ] Cloud Console 프로젝트 생성 (자사몰용)
- [ ] OAuth 동의 화면 설정 (양쪽)
- [ ] 테스트 사용자 추가
- [ ] OAuth 클라이언트 ID 생성
- [ ] 승인된 JavaScript 원본 등록
- [ ] 리디렉션 URI 등록
- [ ] Client ID / Secret 복사

### 환경변수
- [ ] 관리자 시스템 .env 파일 설정
- [ ] 자사몰 .env 파일 설정
- [ ] NEXTAUTH_SECRET 생성

---

## 6. 문제 해결

### 카카오 "redirect_uri_mismatch" 에러
- Redirect URI가 정확히 일치하는지 확인
- http/https 구분 확인
- 마지막 슬래시(/) 유무 확인

### 네이버 "인가되지 않은 접근" 에러
- 테스트 계정이 앱 관리자 계정과 동일한지 확인
- 검수 전에는 앱 등록자 계정으로만 테스트 가능

### 구글 "400: redirect_uri_mismatch" 에러
- 승인된 리디렉션 URI 확인
- Cloud Console에서 정확한 URI 등록 필요
- 변경 사항 적용까지 몇 분 소요될 수 있음

### 구글 "앱이 확인되지 않음" 경고
- 개발 중에는 정상 (테스트 사용자만 접근 가능)
- "계속" 클릭하면 진행 가능
- 프로덕션 시 앱 인증 절차 필요

---

## 7. 참고 링크

- [카카오 로그인 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [네이버 로그인 문서](https://developers.naver.com/docs/login/overview/overview.md)
- [구글 OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js 문서](https://next-auth.js.org/providers/)

---

*마지막 업데이트: 2024년 12월*
