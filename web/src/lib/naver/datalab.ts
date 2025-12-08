/**
 * 네이버 데이터랩 API 클라이언트
 *
 * 네이버 데이터랩 API를 사용하여 검색 트렌드 및 쇼핑 인사이트 데이터를 수집합니다.
 *
 * 사용하려면:
 * 1. https://developers.naver.com 에서 애플리케이션 등록
 * 2. 데이터랩 API 사용 신청
 * 3. Client ID와 Client Secret을 환경변수에 설정
 */

// 검색어 트렌드 응답
export interface SearchTrendResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: {
    title: string;
    keywords: string[];
    data: {
      period: string;
      ratio: number;
    }[];
  }[];
}

// 쇼핑 인사이트 응답
export interface ShoppingInsightResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: {
    title: string;
    category: string[];
    data: {
      period: string;
      ratio: number;
    }[];
  }[];
}

// 쇼핑 카테고리별 트렌드
export interface CategoryTrendResponse {
  startDate: string;
  endDate: string;
  timeUnit: string;
  results: {
    title: string;
    category: string[];
    data: {
      period: string;
      ratio: number;
    }[];
  }[];
}

// 농수산물 카테고리 코드 (네이버 쇼핑)
export const NAVER_FRESH_CATEGORIES = {
  // 식품
  food: '50000000',
  // 과일
  fruits: '50000803',
  // 채소
  vegetables: '50000804',
  // 수산물/건어물
  seafood: '50000805',
  // 정육/계란류
  meat: '50000806',
  // 쌀/잡곡
  rice: '50000807',
};

export class NaverDatalabClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://openapi.naver.com/v1/datalab';

  constructor(clientId?: string, clientSecret?: string) {
    this.clientId = clientId || process.env.NAVER_CLIENT_ID || '';
    this.clientSecret = clientSecret || process.env.NAVER_CLIENT_SECRET || '';
  }

  /**
   * API 인증 헤더
   */
  private getHeaders() {
    return {
      'X-Naver-Client-Id': this.clientId,
      'X-Naver-Client-Secret': this.clientSecret,
      'Content-Type': 'application/json',
    };
  }

  /**
   * 날짜 포맷 (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 검색어 트렌드 조회
   * 특정 키워드의 검색량 변화 추이를 조회합니다.
   */
  async getSearchTrend(params: {
    keywords: string[];
    startDate?: Date;
    endDate?: Date;
    timeUnit?: 'date' | 'week' | 'month';
  }): Promise<SearchTrendResponse | null> {
    const { keywords, timeUnit = 'week' } = params;
    // 오늘 날짜 기준으로 90일 전 ~ 어제까지 조회
    const today = new Date();
    const endDate = params.endDate || new Date(today.getTime() - 24 * 60 * 60 * 1000); // 어제
    const startDate = params.startDate || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000); // 90일 전

    const body = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      timeUnit,
      keywordGroups: keywords.map((keyword) => ({
        groupName: keyword,
        keywords: [keyword],
      })),
    };

    console.log('[NaverDatalab] 요청:', JSON.stringify(body));

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[NaverDatalab] 검색 트렌드 조회 실패:', response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log('[NaverDatalab] 응답 성공');
      return result;
    } catch (error) {
      console.error('[NaverDatalab] 검색 트렌드 조회 오류:', error);
      return null;
    }
  }

  /**
   * 쇼핑 인사이트 - 카테고리별 트렌드
   * 특정 카테고리의 검색량 변화 추이를 조회합니다.
   */
  async getShoppingCategoryTrend(params: {
    category: string; // 카테고리 코드
    startDate?: Date;
    endDate?: Date;
    timeUnit?: 'date' | 'week' | 'month';
    device?: 'pc' | 'mo' | '';
    gender?: 'm' | 'f' | '';
    ages?: string[]; // ['10', '20', '30', '40', '50', '60']
  }): Promise<CategoryTrendResponse | null> {
    const { category, timeUnit = 'week', device = '', gender = '', ages = [] } = params;
    const startDate = params.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const body = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      timeUnit,
      category: [{ name: '카테고리', param: [category] }],
      device,
      gender,
      ages,
    };

    try {
      const response = await fetch(`${this.baseUrl}/shopping/categories`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('[NaverDatalab] 쇼핑 카테고리 트렌드 조회 실패:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NaverDatalab] 쇼핑 카테고리 트렌드 조회 오류:', error);
      return null;
    }
  }

  /**
   * 쇼핑 인사이트 - 키워드별 트렌드
   */
  async getShoppingKeywordTrend(params: {
    keyword: string;
    startDate?: Date;
    endDate?: Date;
    timeUnit?: 'date' | 'week' | 'month';
  }): Promise<ShoppingInsightResponse | null> {
    const { keyword, timeUnit = 'week' } = params;
    const startDate = params.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = params.endDate || new Date();

    const body = {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      timeUnit,
      keyword: [{ name: keyword, param: [keyword] }],
    };

    try {
      const response = await fetch(`${this.baseUrl}/shopping/keywords`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('[NaverDatalab] 쇼핑 키워드 트렌드 조회 실패:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[NaverDatalab] 쇼핑 키워드 트렌드 조회 오류:', error);
      return null;
    }
  }

  /**
   * 농수산물 카테고리 트렌드 조회 (간편 메서드)
   */
  async getFreshProductTrend(
    category: 'fruits' | 'vegetables' | 'seafood' | 'meat' | 'all' = 'all'
  ) {
    const categoryCode = category === 'all'
      ? NAVER_FRESH_CATEGORIES.food
      : NAVER_FRESH_CATEGORIES[category];

    return this.getShoppingCategoryTrend({ category: categoryCode });
  }

  /**
   * 여러 농수산물 키워드 트렌드 비교
   */
  async compareFreshKeywords(keywords: string[]) {
    return this.getSearchTrend({ keywords });
  }

  /**
   * API 키 유효성 확인
   */
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}

// 싱글톤 인스턴스
let datalabInstance: NaverDatalabClient | null = null;

export function getNaverDatalabClient(): NaverDatalabClient {
  if (!datalabInstance) {
    datalabInstance = new NaverDatalabClient();
  }
  return datalabInstance;
}

/**
 * Mock 트렌드 데이터 (API 미설정 시 사용)
 */
export function getMockTrendData(): SearchTrendResponse {
  const today = new Date();
  const data = [];

  // 최근 12주 데이터 생성
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i * 7);
    data.push({
      period: date.toISOString().split('T')[0],
      ratio: 50 + Math.random() * 50, // 50~100 사이 랜덤
    });
  }

  return {
    startDate: data[0].period,
    endDate: data[data.length - 1].period,
    timeUnit: 'week',
    results: [
      {
        title: '감귤',
        keywords: ['감귤'],
        data: data.map(d => ({ ...d, ratio: 70 + Math.random() * 30 })),
      },
      {
        title: '사과',
        keywords: ['사과'],
        data: data.map(d => ({ ...d, ratio: 60 + Math.random() * 30 })),
      },
      {
        title: '딸기',
        keywords: ['딸기'],
        data: data.map(d => ({ ...d, ratio: 50 + Math.random() * 40 })),
      },
      {
        title: '한라봉',
        keywords: ['한라봉'],
        data: data.map(d => ({ ...d, ratio: 40 + Math.random() * 30 })),
      },
    ],
  };
}
