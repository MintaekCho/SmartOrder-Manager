import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.SHOP_URL || 'http://localhost:3005',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// 자사몰 공개 카테고리 목록 조회 (인증 불필요)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeChildren = searchParams.get('includeChildren') === 'true';
    const flat = searchParams.get('flat') === 'true';

    // 활성화된 카테고리만 조회
    const where: any = {
      isActive: true,
      isVisible: true,
    };

    if (flat) {
      // 플랫 리스트 (드롭다운용)
      const categories = await prisma.shopCategory.findMany({
        where,
        orderBy: [
          { displayOrder: 'asc' },
          { name: 'asc' },
        ],
        select: {
          id: true,
          name: true,
          slug: true,
          code: true,
          description: true,
          imageUrl: true,
          icon: true,
          parentId: true,
        },
      });

      const response = NextResponse.json({
        success: true,
        data: categories,
      });

      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    // 계층 구조로 반환 (최상위 카테고리만)
    where.parentId = null;

    const categories = await prisma.shopCategory.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        description: true,
        imageUrl: true,
        icon: true,
        children: includeChildren ? {
          where: {
            isActive: true,
            isVisible: true,
          },
          orderBy: [
            { displayOrder: 'asc' },
            { name: 'asc' },
          ],
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            description: true,
            imageUrl: true,
            icon: true,
            children: {
              where: {
                isActive: true,
                isVisible: true,
              },
              orderBy: [
                { displayOrder: 'asc' },
                { name: 'asc' },
              ],
              select: {
                id: true,
                name: true,
                slug: true,
                code: true,
                description: true,
                imageUrl: true,
                icon: true,
              },
            },
          },
        } : undefined,
      },
    });

    const response = NextResponse.json({
      success: true,
      data: categories,
    });

    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('공개 카테고리 목록 조회 에러:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회에 실패했습니다.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
