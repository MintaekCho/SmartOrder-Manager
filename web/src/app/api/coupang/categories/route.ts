import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

/**
 * 쿠팡 카테고리 API
 *
 * GET /api/coupang/categories
 * - ?parentCode=0 : 최상위 카테고리 목록 (기본값)
 * - ?parentCode=12345 : 해당 카테고리의 하위 카테고리 목록
 * - ?meta=12345 : 해당 카테고리의 메타정보 (상품고시정보, 필수옵션 등)
 *
 * 참고: 쿠팡 API에서 카테고리 검색/추천 기능은 공식 제공되지 않음
 * 검색이 필요한 경우 /api/platform/categories?platform=COUPANG&keyword=... 사용
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentCode = searchParams.get('parentCode');
    const meta = searchParams.get('meta');

    const client = await getCoupangClient();

    // 카테고리 메타 정보 조회 (상품고시정보, 필수옵션 등)
    if (meta) {
      const response = await client.getCategoryMeta(parseInt(meta));
      return NextResponse.json({
        success: true,
        data: response.data,
      });
    }

    // 카테고리 목록 조회 (parentCode 기본값 0 = 최상위)
    const displayCategoryCode = parentCode ? parseInt(parentCode) : 0;
    const response = await client.getDisplayCategories(displayCategoryCode);

    return NextResponse.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('[API] Coupang categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
