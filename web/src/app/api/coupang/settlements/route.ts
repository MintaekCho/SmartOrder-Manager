import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 정산 내역 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;
    const settleDateFrom = searchParams.get('settleDateFrom');
    const settleDateTo = searchParams.get('settleDateTo');
    const nextToken = searchParams.get('nextToken');
    const maxPerPage = searchParams.get('maxPerPage');

    if (!vendorId) {
      // Mock 데이터 반환
      return NextResponse.json({
        code: 'SUCCESS',
        message: 'Mock data (no vendorId)',
        data: getMockSettlements(settleDateFrom, settleDateTo),
      });
    }

    if (!settleDateFrom || !settleDateTo) {
      return NextResponse.json(
        { error: 'settleDateFrom and settleDateTo are required' },
        { status: 400 }
      );
    }

    try {
      const client = getCoupangClient();
      const response = await client.getSettlements({
        vendorId,
        settleDateFrom,
        settleDateTo,
        nextToken: nextToken || undefined,
        maxPerPage: maxPerPage ? parseInt(maxPerPage) : 50,
      });

      return NextResponse.json(response);
    } catch (apiError) {
      // 쿠팡 API 에러 시 Mock 데이터 반환
      console.error('[API] Coupang settlements API error, using mock data:', apiError);
      return NextResponse.json({
        code: 'SUCCESS',
        message: 'Mock data (API not available)',
        data: getMockSettlements(settleDateFrom, settleDateTo),
      });
    }
  } catch (error) {
    console.error('[API] Coupang settlements error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settlements' },
      { status: 500 }
    );
  }
}

// Mock 정산 데이터 생성
function getMockSettlements(fromDate?: string | null, toDate?: string | null) {
  const now = new Date();
  const from = fromDate ? new Date(fromDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toDate ? new Date(toDate) : now;

  const mockProducts = [
    { title: '유기농 사과 3kg', option: '부사 / 대과', price: 35000 },
    { title: '제주 감귤 5kg', option: '소과', price: 28000 },
    { title: '한우 등심 1kg', option: '1++ 등급', price: 89000 },
    { title: '국내산 삼겹살 500g', option: '냉장', price: 25000 },
    { title: '자연산 광어회 500g', option: '500g', price: 55000 },
  ];

  const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const itemCount = Math.min(days * 3, 50); // 하루 평균 3건, 최대 50건

  return Array.from({ length: itemCount }, (_, i) => {
    const product = mockProducts[i % mockProducts.length];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const salePrice = product.price * quantity;
    const commission = Math.round(salePrice * (0.08 + Math.random() * 0.04)); // 8~12% 수수료
    const couponDiscount = Math.random() > 0.7 ? Math.round(salePrice * 0.05) : 0;
    const deliveryCharge = salePrice >= 50000 ? 0 : 3000;

    const settleDate = new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));

    return {
      settleDate: settleDate.toISOString().split('T')[0],
      orderId: 1001234560 + i,
      productTitle: product.title,
      optionTitle: product.option,
      quantity,
      salePrice,
      couponDiscount,
      deliveryCharge,
      commission,
      settlementAmount: salePrice - commission - couponDiscount + deliveryCharge,
    };
  }).sort((a, b) => b.settleDate.localeCompare(a.settleDate)); // 최신순 정렬
}
