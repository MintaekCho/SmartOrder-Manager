import { NextRequest, NextResponse } from 'next/server';
import { getDomeggookCrawler, closeDomeggookCrawler, getMockWholesaleProducts } from '@/lib/crawler/domeggook-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 도매처 크롤링 API
 * GET /api/crawl/wholesale?keyword=사과&maxItems=20
 * GET /api/crawl/wholesale?type=fruits&maxItems=20
 * GET /api/crawl/wholesale?useMock=true (Mock 데이터 사용)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const keyword = searchParams.get('keyword');
  const type = searchParams.get('type') as 'fruits' | 'vegetables' | 'seafood' | 'meat' | null;
  const maxItems = parseInt(searchParams.get('maxItems') || '20', 10);
  const useMock = searchParams.get('useMock') === 'true';

  // Mock 데이터 사용 (테스트 또는 크롤링 실패 시)
  if (useMock) {
    const searchKeyword = keyword || (type ? {
      fruits: '과일',
      vegetables: '채소',
      seafood: '수산물',
      meat: '정육',
    }[type] : '농산물');

    const result = getMockWholesaleProducts(searchKeyword, maxItems);
    return NextResponse.json(result);
  }

  const crawler = getDomeggookCrawler();

  try {
    let result;

    if (type) {
      // 카테고리별 검색
      result = await crawler.searchFreshProducts(type, maxItems);
    } else if (keyword) {
      // 키워드 검색
      result = await crawler.search(keyword, { maxItems });
    } else {
      // 기본값으로 Mock 데이터 반환
      const result = getMockWholesaleProducts('농산물', maxItems);
      return NextResponse.json(result);
    }

    // 크롤링 결과가 없으면 Mock 데이터 반환
    if (!result.success || result.items.length === 0) {
      const mockResult = getMockWholesaleProducts(keyword || '농산물', maxItems);
      return NextResponse.json({
        ...mockResult,
        message: '크롤링 결과가 없어 Mock 데이터를 반환합니다.',
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] 도매처 크롤링 오류:', error);

    // 오류 발생 시 Mock 데이터 반환
    const mockResult = getMockWholesaleProducts(keyword || '농산물', maxItems);
    return NextResponse.json({
      ...mockResult,
      message: '크롤링 오류로 Mock 데이터를 반환합니다.',
    });
  }
}

/**
 * 크롤러 종료
 */
export async function DELETE() {
  try {
    await closeDomeggookCrawler();
    return NextResponse.json({ success: true, message: '크롤러가 종료되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '크롤러 종료 실패' },
      { status: 500 }
    );
  }
}
