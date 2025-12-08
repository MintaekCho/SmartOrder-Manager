import { NextRequest, NextResponse } from 'next/server';
import { getCoupangCrawler, closeCoupangCrawler } from '@/lib/crawler/coupang-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 최대 60초

/**
 * 쿠팡 크롤링 API
 * GET /api/crawl/coupang?category=fruits&maxItems=20
 * GET /api/crawl/coupang?keyword=사과&maxItems=20
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') as 'fruits' | 'vegetables' | 'seafood' | 'meat' | 'all' | null;
  const keyword = searchParams.get('keyword');
  const maxItems = parseInt(searchParams.get('maxItems') || '20', 10);

  const crawler = getCoupangCrawler();

  try {
    let result;

    if (keyword) {
      // 키워드 검색
      result = await crawler.searchProducts(keyword, { maxItems });
    } else {
      // 카테고리 베스트셀러
      result = await crawler.crawlFreshBestSellers(category || 'all', maxItems);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] 크롤링 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.',
        items: [],
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}

/**
 * 크롤러 종료 (리소스 정리용)
 * DELETE /api/crawl/coupang
 */
export async function DELETE() {
  try {
    await closeCoupangCrawler();
    return NextResponse.json({ success: true, message: '크롤러가 종료되었습니다.' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '크롤러 종료 실패' },
      { status: 500 }
    );
  }
}
