import { NextRequest, NextResponse } from 'next/server';
import { getCoupangClient } from '@/lib/coupang/client';

// 대시보드 통계 API
// 오늘 주문, 미처리 주문, 오늘 매출, 등록 상품 통계를 반환
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId') || process.env.COUPANG_VENDOR_ID;

    if (!vendorId) {
      return NextResponse.json(
        { error: 'vendorId is required. Set COUPANG_VENDOR_ID in .env or pass as parameter.' },
        { status: 400 }
      );
    }

    const client = getCoupangClient();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 병렬로 API 호출
    const [
      todayOrders,
      yesterdayOrders,
      pendingOrders,
      products,
    ] = await Promise.all([
      // 오늘 주문 (모든 상태)
      client.getOrders({
        vendorId,
        createdAtFrom: today,
        createdAtTo: today,
        status: 'ACCEPT',
        maxPerPage: 50,
      }).catch(() => ({ data: [] })),

      // 어제 주문 (비교용)
      client.getOrders({
        vendorId,
        createdAtFrom: yesterday,
        createdAtTo: yesterday,
        status: 'ACCEPT',
        maxPerPage: 50,
      }).catch(() => ({ data: [] })),

      // 미처리 주문 (발주 대기)
      client.getOrders({
        vendorId,
        status: 'ACCEPT',
        maxPerPage: 50,
      }).catch(() => ({ data: [] })),

      // 등록 상품
      client.getProducts({
        vendorId,
        maxPerPage: 50,
      }).catch(() => ({ data: [] })),
    ]);

    // 오늘 매출 계산
    const todayRevenue = (todayOrders.data || []).reduce((sum, order) => {
      const orderTotal = (order.orderItems || []).reduce((itemSum, item) => {
        return itemSum + (item.orderPrice || 0) * (item.shippingCount || 1);
      }, 0);
      return sum + orderTotal;
    }, 0);

    // 어제 매출 계산
    const yesterdayRevenue = (yesterdayOrders.data || []).reduce((sum, order) => {
      const orderTotal = (order.orderItems || []).reduce((itemSum, item) => {
        return itemSum + (item.orderPrice || 0) * (item.shippingCount || 1);
      }, 0);
      return sum + orderTotal;
    }, 0);

    // 변화율 계산
    const orderChange = yesterdayOrders.data?.length
      ? Math.round(((todayOrders.data?.length || 0) - yesterdayOrders.data.length) / yesterdayOrders.data.length * 100)
      : 0;

    const revenueChange = yesterdayRevenue
      ? Math.round((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100)
      : 0;

    // 판매중 상품 수 계산
    const activeProducts = (products.data || []).filter(
      (p) => p.statusName === '승인완료' || p.statusName === 'APPROVED'
    ).length;

    return NextResponse.json({
      todayOrders: todayOrders.data?.length || 0,
      orderChange,
      pendingOrders: pendingOrders.data?.length || 0,
      todayRevenue,
      revenueChange,
      totalProducts: products.data?.length || 0,
      activeProducts,
    });
  } catch (error) {
    console.error('[API] Dashboard stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
