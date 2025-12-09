import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 카테고리 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const categoryId = searchParams.get('categoryId');

    const client = getCoupangClient();

    // 카테고리 ID로 메타 정보 조회
    if (categoryId) {
      const response = await client.getCategoryMeta(parseInt(categoryId));
      return NextResponse.json(response);
    }

    // 키워드로 카테고리 검색
    if (keyword) {
      const response = await client.searchCategory(keyword);
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'keyword or categoryId is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Coupang categories error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
