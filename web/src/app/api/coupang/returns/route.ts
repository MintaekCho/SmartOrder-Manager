import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 반품/취소 요청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = process.env.COUPANG_VENDOR_ID || '';
    const createdAtFrom = searchParams.get('createdAtFrom') || undefined;
    const createdAtTo = searchParams.get('createdAtTo') || undefined;
    const cancelType = searchParams.get('cancelType') || undefined;
    const status = searchParams.get('status') || 'UC'; // UC: 승인대기 (기본값)
    const nextToken = searchParams.get('nextToken') || undefined;

    if (!vendorId) {
      // Mock 데이터 반환
      return NextResponse.json({
        code: 'SUCCESS',
        message: 'Mock data',
        data: getMockReturns(),
      });
    }

    const client = getCoupangClient();

    // 여러 상태의 데이터를 조회하여 합침
    const statuses = ['UC', 'CC', 'RC']; // 승인대기, 승인완료, 수거완료
    const allResults: any[] = [];

    for (const s of statuses) {
      try {
        const result = await client.getCancelRequests({
          vendorId,
          createdAtFrom,
          createdAtTo,
          cancelType,
          status: s,
          nextToken,
        });
        if (result.data && Array.isArray(result.data)) {
          allResults.push(...result.data.map((item: any) => ({
            ...item,
            status: s === 'UC' ? 'REQUEST' : s === 'CC' ? 'APPROVED' : 'COLLECT_DONE',
          })));
        }
      } catch (e) {
        console.log(`[API] No data for status ${s}`);
      }
    }

    return NextResponse.json({
      code: 'SUCCESS',
      message: 'Success',
      data: allResults,
    });
  } catch (error) {
    console.error('[API] Returns fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

// 반품/취소 승인 처리
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { receiptId, action } = body;

    const vendorId = process.env.COUPANG_VENDOR_ID || '';

    if (!vendorId) {
      // Mock 응답
      return NextResponse.json({
        code: 'SUCCESS',
        message: `Mock: ${action} 처리 완료 (receiptId: ${receiptId})`,
      });
    }

    const client = getCoupangClient();

    if (action === 'approve') {
      const result = await client.approveCancel(vendorId, receiptId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Return action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process return' },
      { status: 500 }
    );
  }
}

// Mock 데이터
function getMockReturns() {
  const now = new Date();
  return [
    {
      receiptId: 90001,
      orderId: 1001234567,
      shipmentBoxId: 500001,
      cancelType: 'RETURN',
      cancelReason: '단순변심',
      cancelReasonDetail: '다른 상품으로 교환하고 싶습니다',
      status: 'RELEASE',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      productName: '유기농 사과 3kg',
      optionName: '부사 / 대과',
      quantity: 1,
      orderPrice: 35000,
      buyerName: '김**',
    },
    {
      receiptId: 90002,
      orderId: 1001234568,
      shipmentBoxId: 500002,
      cancelType: 'CANCEL',
      cancelReason: '고객변심',
      cancelReasonDetail: '주문 실수입니다',
      status: 'REQUEST',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      productName: '제주 감귤 5kg',
      optionName: '소과 / 5kg',
      quantity: 2,
      orderPrice: 28000,
      buyerName: '이**',
    },
    {
      receiptId: 90003,
      orderId: 1001234569,
      shipmentBoxId: 500003,
      cancelType: 'RETURN',
      cancelReason: '상품불량',
      cancelReasonDetail: '배송 중 파손되었습니다',
      status: 'COLLECT_DONE',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      productName: '한우 등심 1kg',
      optionName: '1++ 등급',
      quantity: 1,
      orderPrice: 89000,
      buyerName: '박**',
    },
    {
      receiptId: 90004,
      orderId: 1001234570,
      shipmentBoxId: 500004,
      cancelType: 'EXCHANGE',
      cancelReason: '오배송',
      cancelReasonDetail: '주문한 상품과 다른 상품이 왔습니다',
      status: 'REQUEST',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      productName: '국내산 돼지고기 삼겹살 500g',
      optionName: '냉장 / 500g',
      quantity: 3,
      orderPrice: 45000,
      buyerName: '최**',
    },
    {
      receiptId: 90005,
      orderId: 1001234571,
      shipmentBoxId: 500005,
      cancelType: 'RETURN',
      cancelReason: '상품불량',
      cancelReasonDetail: '신선도가 좋지 않습니다',
      status: 'APPROVED',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      productName: '자연산 광어 회 500g',
      optionName: '500g',
      quantity: 1,
      orderPrice: 55000,
      buyerName: '정**',
    },
  ];
}
