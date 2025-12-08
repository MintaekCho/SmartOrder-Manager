import { NextRequest, NextResponse } from 'next/server';
import { getNaverDatalabClient, getMockTrendData } from '@/lib/naver/datalab';

export const dynamic = 'force-dynamic';

/**
 * 트렌드 데이터 API
 * GET /api/trends?keywords=감귤,사과,딸기
 * GET /api/trends?category=fruits
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keywordsParam = searchParams.get('keywords');
  const category = searchParams.get('category') as 'fruits' | 'vegetables' | 'seafood' | 'meat' | 'all' | null;

  const client = getNaverDatalabClient();

  // API 키가 설정되지 않은 경우 Mock 데이터 반환
  if (!client.isConfigured()) {
    console.log('[API] 네이버 API 키 미설정, Mock 데이터 반환');
    return NextResponse.json({
      success: true,
      source: 'mock',
      message: '네이버 API 키가 설정되지 않아 Mock 데이터를 반환합니다.',
      data: getMockTrendData(),
    });
  }

  try {
    let result;

    if (keywordsParam) {
      // 키워드 트렌드 조회
      const keywords = keywordsParam.split(',').map(k => k.trim());
      result = await client.getSearchTrend({ keywords });
    } else if (category) {
      // 카테고리 트렌드 조회
      result = await client.getFreshProductTrend(category);
    } else {
      // 기본: 제철 과일 트렌드
      const seasonalKeywords = ['감귤', '사과', '딸기', '한라봉'];
      result = await client.getSearchTrend({ keywords: seasonalKeywords });
    }

    if (!result) {
      // API 실패시 Mock 데이터
      return NextResponse.json({
        success: true,
        source: 'mock',
        message: '네이버 API 호출 실패, Mock 데이터를 반환합니다.',
        data: getMockTrendData(),
      });
    }

    return NextResponse.json({
      success: true,
      source: 'naver',
      data: result,
    });
  } catch (error) {
    console.error('[API] 트렌드 조회 오류:', error);
    return NextResponse.json({
      success: true,
      source: 'mock',
      message: '트렌드 조회 중 오류 발생, Mock 데이터를 반환합니다.',
      data: getMockTrendData(),
    });
  }
}
