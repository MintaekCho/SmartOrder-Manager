import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface TrendDataPoint {
  date: string;
  ratio: number;
}

interface NaverTrendResult {
  keyword: string;
  period: {
    startDate: string;
    endDate: string;
  };
  trendData: TrendDataPoint[];
  summary: {
    avgRatio: number;
    maxRatio: number;
    minRatio: number;
    currentRatio: number;
    trendDirection: 'rising' | 'falling' | 'stable';
    changeRate: number; // 최근 vs 이전 변화율
  };
  relatedKeywords?: string[];
}

/**
 * 네이버 검색 트렌드 API
 * GET /api/research/naver-trend?keyword=사과&period=30
 *
 * 네이버 데이터랩 API 또는 크롤링을 통해 검색량 트렌드를 조회합니다.
 *
 * 공식 API 사용 시: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 환경변수 필요
 * https://developers.naver.com/docs/serviceapi/datalab/search/search.md
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const period = parseInt(searchParams.get('period') || '30'); // 일 수
  const useMock = searchParams.get('useMock') === 'true';

  if (!keyword) {
    return NextResponse.json(
      { success: false, error: '키워드가 필요합니다.' },
      { status: 400 }
    );
  }

  // Mock 데이터
  if (useMock) {
    return NextResponse.json({
      success: true,
      source: 'mock',
      data: generateMockNaverTrend(keyword, period),
    });
  }

  // 네이버 API 키 확인
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (clientId && clientSecret) {
    // 공식 API 사용
    try {
      const result = await fetchNaverTrendAPI(keyword, period, clientId, clientSecret);
      return NextResponse.json({
        success: true,
        source: 'naver-api',
        data: result,
      });
    } catch (error) {
      console.error('[API] 네이버 API 오류:', error);
      // API 실패 시 Mock 데이터로 폴백
      return NextResponse.json({
        success: true,
        source: 'mock-fallback',
        data: generateMockNaverTrend(keyword, period),
        warning: '네이버 API 호출 실패, Mock 데이터 사용',
      });
    }
  }

  // API 키 없으면 Mock 데이터
  return NextResponse.json({
    success: true,
    source: 'mock',
    data: generateMockNaverTrend(keyword, period),
    info: '네이버 API 키가 설정되지 않았습니다. Mock 데이터를 반환합니다.',
  });
}

async function fetchNaverTrendAPI(
  keyword: string,
  period: number,
  clientId: string,
  clientSecret: string
): Promise<NaverTrendResult> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - period);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const requestBody = {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    timeUnit: 'date',
    keywordGroups: [
      {
        groupName: keyword,
        keywords: [keyword],
      },
    ],
  };

  const response = await fetch('https://openapi.naver.com/v1/datalab/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`네이버 API 응답 오류: ${response.status}`);
  }

  const data = await response.json();

  // 응답 데이터 파싱
  const trendData: TrendDataPoint[] = data.results[0]?.data?.map((item: any) => ({
    date: item.period,
    ratio: item.ratio,
  })) || [];

  const ratios = trendData.map(d => d.ratio);
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const maxRatio = Math.max(...ratios);
  const minRatio = Math.min(...ratios);
  const currentRatio = ratios[ratios.length - 1] || 0;

  // 트렌드 방향 계산 (최근 7일 vs 이전 7일)
  const recentWeek = ratios.slice(-7);
  const previousWeek = ratios.slice(-14, -7);

  const recentAvg = recentWeek.reduce((a, b) => a + b, 0) / recentWeek.length;
  const previousAvg = previousWeek.length > 0
    ? previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length
    : recentAvg;

  const changeRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  let trendDirection: 'rising' | 'falling' | 'stable';
  if (changeRate > 5) {
    trendDirection = 'rising';
  } else if (changeRate < -5) {
    trendDirection = 'falling';
  } else {
    trendDirection = 'stable';
  }

  return {
    keyword,
    period: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
    trendData,
    summary: {
      avgRatio: Math.round(avgRatio * 10) / 10,
      maxRatio: Math.round(maxRatio * 10) / 10,
      minRatio: Math.round(minRatio * 10) / 10,
      currentRatio: Math.round(currentRatio * 10) / 10,
      trendDirection,
      changeRate: Math.round(changeRate * 10) / 10,
    },
  };
}

function generateMockNaverTrend(keyword: string, period: number): NaverTrendResult {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - period);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Mock 트렌드 데이터 생성 (약간의 변동성 추가)
  const trendData: TrendDataPoint[] = [];
  let baseValue = 50 + Math.random() * 30; // 50~80 시작

  for (let i = 0; i < period; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // 약간의 랜덤 변동 + 상승 트렌드
    const variation = (Math.random() - 0.4) * 10; // -4 ~ +6 변동
    baseValue = Math.max(20, Math.min(100, baseValue + variation));

    // 주말에는 검색량 증가
    const dayOfWeek = date.getDay();
    const weekendBonus = (dayOfWeek === 0 || dayOfWeek === 6) ? 5 : 0;

    trendData.push({
      date: formatDate(date),
      ratio: Math.round((baseValue + weekendBonus) * 10) / 10,
    });
  }

  const ratios = trendData.map(d => d.ratio);
  const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  const maxRatio = Math.max(...ratios);
  const minRatio = Math.min(...ratios);
  const currentRatio = ratios[ratios.length - 1];

  // 트렌드 방향 계산
  const recentWeek = ratios.slice(-7);
  const previousWeek = ratios.slice(-14, -7);

  const recentAvg = recentWeek.reduce((a, b) => a + b, 0) / recentWeek.length;
  const previousAvg = previousWeek.length > 0
    ? previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length
    : recentAvg;

  const changeRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

  let trendDirection: 'rising' | 'falling' | 'stable';
  if (changeRate > 5) {
    trendDirection = 'rising';
  } else if (changeRate < -5) {
    trendDirection = 'falling';
  } else {
    trendDirection = 'stable';
  }

  // 관련 키워드 (Mock)
  const relatedKeywords = generateRelatedKeywords(keyword);

  return {
    keyword,
    period: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
    },
    trendData,
    summary: {
      avgRatio: Math.round(avgRatio * 10) / 10,
      maxRatio: Math.round(maxRatio * 10) / 10,
      minRatio: Math.round(minRatio * 10) / 10,
      currentRatio: Math.round(currentRatio * 10) / 10,
      trendDirection,
      changeRate: Math.round(changeRate * 10) / 10,
    },
    relatedKeywords,
  };
}

function generateRelatedKeywords(keyword: string): string[] {
  const suffixes = ['가격', '추천', '맛있는', '산지직송', '선물세트', '할인'];
  const prefixes = ['싱싱한', '달콤한', '유기농', '국내산', '제철'];

  const related: string[] = [];

  // 접미사 조합
  suffixes.slice(0, 3).forEach(suffix => {
    related.push(`${keyword} ${suffix}`);
  });

  // 접두사 조합
  prefixes.slice(0, 2).forEach(prefix => {
    related.push(`${prefix} ${keyword}`);
  });

  return related;
}
