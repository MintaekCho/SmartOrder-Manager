import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClientWithVendorId } from '@/lib/coupang/client';

// 쿠팡 주문 상태를 대시보드 상태로 매핑
function mapOrderStatus(status: string): 'pending' | 'processing' | 'completed' | 'error' {
  switch (status) {
    case 'ACCEPT': // 결제완료/발주확인
      return 'pending';
    case 'INSTRUCT': // 상품준비중
    case 'DEPARTURE': // 배송지시
    case 'DELIVERING': // 배송중
      return 'processing';
    case 'FINAL_DELIVERY': // 배송완료
      return 'completed';
    default:
      return 'error';
  }
}

// 최근 주문 목록 API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    const { client, vendorId } = await getCoupangClientWithVendorId();

    // 최근 7일간 주문 조회
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const response = await client.getOrders({
      vendorId,
      createdAtFrom: sevenDaysAgo,
      createdAtTo: today,
      status: 'ACCEPT',
      maxPerPage: limit,
    });

    // 대시보드 형식으로 변환
    const orders = (response.data || []).map((order, index) => {
      const firstItem = order.orderItems?.[0];
      const totalAmount = (order.orderItems || []).reduce((sum, item) => {
        return sum + (item.orderPrice || 0) * (item.shippingCount || 1);
      }, 0);
      const totalQuantity = (order.orderItems || []).reduce((sum, item) => {
        return sum + (item.shippingCount || 1);
      }, 0);

      return {
        id: String(order.shipmentBoxId || index + 1),
        orderId: `#COU-${order.orderId}`,
        productName: firstItem?.sellerProductName || firstItem?.vendorItemName || '상품명 없음',
        quantity: totalQuantity,
        amount: totalAmount,
        status: mapOrderStatus(order.status),
        orderedAt: order.orderedAt || '',
      };
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('[API] Recent orders error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent orders' },
      { status: 500 }
    );
  }
}
