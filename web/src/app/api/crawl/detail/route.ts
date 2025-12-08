import { NextRequest, NextResponse } from 'next/server';
import { getDomeggookCrawler } from '@/lib/crawler/domeggook-crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * 상품 상세페이지 크롤링 API
 * GET /api/crawl/detail?url=https://domeggook.com/...
 *
 * 도매처 상세페이지에서 이미지들을 크롤링해옵니다.
 * 이 이미지들을 쿠팡 상세페이지로 그대로 사용합니다.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productUrl = searchParams.get('url');
  const useMock = searchParams.get('useMock') === 'true';

  if (!productUrl && !useMock) {
    return NextResponse.json(
      { success: false, error: 'url 파라미터가 필요합니다.' },
      { status: 400 }
    );
  }

  // Mock 데이터 (테스트용)
  if (useMock || productUrl?.includes('mock')) {
    return NextResponse.json({
      success: true,
      source: 'mock',
      detailImages: [
        'https://images.unsplash.com/photo-1547514701-42782101795e?w=800',
        'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=800',
        'https://images.unsplash.com/photo-1597714026720-8f74c62310ba?w=800',
      ],
      detailHtml: `
        <div style="text-align: center; padding: 20px;">
          <h2>상품 상세 정보</h2>
          <p>도매처에서 제공하는 상세 이미지입니다.</p>
          <p>실제 크롤링 시 도매처의 상세페이지 이미지가 여기에 표시됩니다.</p>
        </div>
      `,
      description: '도매처에서 제공하는 상품 설명입니다.',
      message: 'Mock 데이터 사용 중',
    });
  }

  const crawler = getDomeggookCrawler();

  try {
    const result = await crawler.crawlProductDetail(productUrl!);

    if (!result.success || result.detailImages.length === 0) {
      // 크롤링 실패 시 에러 반환 (Mock 사용 안함)
      return NextResponse.json({
        success: false,
        source: 'crawl',
        detailImages: [],
        detailHtml: '',
        description: '',
        error: result.error || '상세 이미지를 찾지 못했습니다.',
      });
    }

    return NextResponse.json({
      ...result,
      success: true,
      source: 'crawl',
    });
  } catch (error) {
    console.error('[API] 상세페이지 크롤링 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '크롤링 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
