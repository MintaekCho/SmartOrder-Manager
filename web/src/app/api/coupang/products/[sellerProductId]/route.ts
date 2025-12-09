import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 상품 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerProductId: string }> }
) {
  try {
    const { sellerProductId } = await params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    if (!sellerProductId) {
      return NextResponse.json({ error: 'sellerProductId is required' }, { status: 400 });
    }

    const client = getCoupangClient();
    const response = await client.getProduct(vendorId, parseInt(sellerProductId));

    // seller-products API는 배열로 응답하므로 첫 번째 항목 추출
    if (response.data && Array.isArray(response.data)) {
      const product = response.data[0];
      if (!product) {
        return NextResponse.json(
          { error: '상품을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ ...response, data: product });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] Coupang product detail error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product detail' },
      { status: 500 }
    );
  }
}
