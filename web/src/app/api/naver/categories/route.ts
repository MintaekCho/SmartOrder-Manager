import { NextRequest, NextResponse } from 'next/server';
import { getNaverCommerceClient } from '@/lib/naver-api/client';

/**
 * 네이버 스마트스토어 카테고리 API
 *
 * GET /api/naver/categories
 * - (기본) : 전체 카테고리 목록
 * - ?parentId=50000000 : 해당 카테고리의 하위 카테고리 목록
 * - ?keyword=검색어 : 카테고리 검색
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const keyword = searchParams.get('keyword');

    const client = getNaverCommerceClient();

    if (!client.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: '네이버 커머스 API 인증 정보가 설정되지 않았습니다.',
      }, { status: 400 });
    }

    // 키워드로 카테고리 검색
    if (keyword) {
      const categories = await client.searchCategories(keyword);
      return NextResponse.json({
        success: true,
        data: categories,
      });
    }

    // 카테고리 목록 조회 (parentId가 있으면 하위 카테고리)
    const categories = await client.getCategories(parentId || undefined);

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[API] Naver categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
