import { NextRequest, NextResponse } from 'next/server';
import { generateDetailPage, DetailPageConfig } from '@/lib/product/detail-generator';
import { WholesaleProduct } from '@/lib/crawler/domeggook-crawler';

export const dynamic = 'force-dynamic';

/**
 * 상세페이지 생성 API
 * POST /api/products/generate-detail
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product, template = 'basic' } = body as {
      product: WholesaleProduct;
      template?: 'basic' | 'premium' | 'minimal';
    };

    if (!product) {
      return NextResponse.json(
        { success: false, error: '상품 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    const config: DetailPageConfig = {
      template,
      showOrigin: true,
      showSeller: false,
      showShippingInfo: true,
    };

    const result = generateDetailPage(product, config);

    return NextResponse.json({
      success: true,
      html: result.html,
      preview: result.preview,
      images: result.images,
    });
  } catch (error) {
    console.error('[API] 상세페이지 생성 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상세페이지 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
