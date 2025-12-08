/**
 * Stealth 모드 크롤링 테스트
 * 봇 탐지 우회를 위한 다양한 기법 적용
 *
 * 실행: npx tsx scripts/test-stealth-crawl.ts
 */

import { chromium, Browser, Page } from 'playwright';

// 랜덤 User-Agent 목록
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

// 랜덤 지연
function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// 랜덤 User-Agent 선택
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Stealth 설정 적용
async function applyStealthSettings(page: Page) {
  // WebDriver 속성 숨기기
  await page.addInitScript(() => {
    // navigator.webdriver 숨기기
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });

    // Chrome 속성 추가
    (window as any).chrome = {
      runtime: {},
    };

    // Permissions API 수정
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: 'denied' } as PermissionStatus)
        : originalQuery(parameters);

    // Plugin 배열 수정
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Languages 설정
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ko-KR', 'ko', 'en-US', 'en'],
    });
  });
}

// 마우스 움직임 시뮬레이션
async function simulateHumanBehavior(page: Page) {
  // 랜덤 마우스 움직임
  const width = 1280;
  const height = 800;

  for (let i = 0; i < 3; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    await page.mouse.move(x, y);
    await randomDelay(100, 300);
  }

  // 스크롤
  await page.mouse.wheel(0, Math.floor(Math.random() * 300));
  await randomDelay(500, 1000);
}

async function testDomeggookStealth() {
  console.log('🔒 Stealth 모드 크롤링 테스트\n');
  console.log('=' .repeat(50));

  const userAgent = getRandomUserAgent();
  console.log(`\n📱 User-Agent: ${userAgent.substring(0, 50)}...`);

  const browser = await chromium.launch({
    headless: false, // 처음에는 headful로 테스트
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  });

  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1280, height: 800 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    geolocation: { latitude: 37.5665, longitude: 126.978 },
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    },
  });

  const page = await context.newPage();

  // Stealth 설정 적용
  await applyStealthSettings(page);

  try {
    // 1. 도매꾹 메인페이지 먼저 방문 (쿠키 획득)
    console.log('\n📍 Step 1: 도매꾹 메인페이지 방문');
    await page.goto('https://domeggook.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await randomDelay(2000, 4000);
    await simulateHumanBehavior(page);

    const mainTitle = await page.title();
    console.log(`   페이지 타이틀: ${mainTitle}`);

    // 스크린샷
    await page.screenshot({ path: 'stealth-domeggook-main.png' });
    console.log('   📸 스크린샷: stealth-domeggook-main.png');

    // 2. 검색 시도
    console.log('\n📍 Step 2: 검색 시도');
    await randomDelay(1000, 2000);

    // 검색창 찾기
    const searchInput = await page.$('input[name="keyword"], input[type="search"], #keyword, .search-input');
    if (searchInput) {
      console.log('   검색창 발견! 검색어 입력 중...');

      // 타이핑 시뮬레이션 (한 글자씩)
      const keyword = '과일';
      await searchInput.click();
      await randomDelay(300, 500);

      for (const char of keyword) {
        await searchInput.type(char, { delay: Math.random() * 150 + 50 });
      }
      await randomDelay(500, 1000);

      // 엔터 또는 검색 버튼
      await page.keyboard.press('Enter');
      await randomDelay(3000, 5000);
    } else {
      // 직접 URL 이동
      console.log('   검색창 없음, URL로 직접 이동');
      await page.goto('https://domeggook.com/main/item/itemList.php?search_text=%EA%B3%BC%EC%9D%BC', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await randomDelay(2000, 4000);
    }

    await simulateHumanBehavior(page);

    // 스크린샷
    await page.screenshot({ path: 'stealth-domeggook-search.png' });
    console.log('   📸 스크린샷: stealth-domeggook-search.png');

    // 페이지 분석
    const pageContent = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));

    console.log('\n📊 페이지 분석:');
    console.log(`   HTML 길이: ${pageContent.length}`);
    console.log(`   본문 미리보기: ${bodyText.substring(0, 200)}...`);

    // 상품 요소 찾기
    const productSelectors = [
      '.item_box',
      '.product-item',
      '.goods-list li',
      '[class*="product"]',
      '[class*="item"]',
    ];

    for (const selector of productSelectors) {
      const count = await page.$$eval(selector, (els) => els.length);
      if (count > 0) {
        console.log(`   ${selector}: ${count}개 발견`);
      }
    }

    // 3. 네이버 쇼핑 테스트
    console.log('\n📍 Step 3: 네이버 쇼핑 테스트');
    await randomDelay(2000, 3000);

    // 새 탭에서 네이버 쇼핑
    const naverPage = await context.newPage();
    await applyStealthSettings(naverPage);

    // 네이버 메인 먼저
    await naverPage.goto('https://www.naver.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await randomDelay(2000, 3000);
    await simulateHumanBehavior(naverPage);

    // 쇼핑으로 이동
    await naverPage.goto('https://shopping.naver.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await randomDelay(2000, 3000);

    await naverPage.screenshot({ path: 'stealth-naver-shopping.png' });
    console.log('   📸 스크린샷: stealth-naver-shopping.png');

    const naverTitle = await naverPage.title();
    console.log(`   페이지 타이틀: ${naverTitle}`);

    // 검색
    const naverSearchInput = await naverPage.$('input[type="search"], input[name="query"], .search_input');
    if (naverSearchInput) {
      console.log('   검색창 발견!');
      await naverSearchInput.click();
      await randomDelay(300, 500);

      for (const char of '제주 감귤') {
        await naverSearchInput.type(char, { delay: Math.random() * 100 + 30 });
      }
      await randomDelay(500, 800);
      await naverPage.keyboard.press('Enter');
      await randomDelay(3000, 5000);

      await naverPage.screenshot({ path: 'stealth-naver-search.png' });
      console.log('   📸 검색 결과: stealth-naver-search.png');

      // 상품 수 확인
      const products = await naverPage.$$('[class*="product"], [class*="item"], .basicList_item');
      console.log(`   발견된 상품: ${products.length}개`);
    }

    console.log('\n✅ Stealth 크롤링 테스트 완료');
    console.log('10초 후 브라우저 종료...');
    await new Promise((r) => setTimeout(r, 10000));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    await page.screenshot({ path: 'stealth-error.png' });
  } finally {
    await browser.close();
  }
}

// 실행
testDomeggookStealth();
